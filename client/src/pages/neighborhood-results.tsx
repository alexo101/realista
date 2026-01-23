import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useRouteTransition } from "@/contexts/route-transition-context";
import { useSkeletonVisibility } from "@/hooks/useSkeletonVisibility";
import { PropertyResults } from "@/components/PropertyResults";
import { GoogleMapsPropertyMap } from "@/components/GoogleMapsPropertyMap";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import GoogleMapsNeighborhoodMap from "@/components/GoogleMapsNeighborhoodMap";
import { Footer } from "@/components/Footer";
import { PropertyFilters, PropertyFilters as PropertyFiltersType } from "@/components/PropertyFilters";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileSearchHeader } from "@/components/MobileSearchHeader";
import { MobileFilterRow } from "@/components/MobileFilterRow";
import { MobileFilterSheet } from "@/components/MobileFilterSheet";
import { FloatingMapButton } from "@/components/FloatingMapButton";
import { Building2, UserCircle, ChevronLeft, HomeIcon, MapPin, Info, Star, ArrowDownAZ, ArrowUpDown, List, Map, Bookmark, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { findDistrictByNeighborhood, isDistrict, parseNeighborhoodDisplayName, getNeighborhoodDisplayName, getDistrictsByCity, getNeighborhoodsByDistrict, getCities, expandNeighborhoodSearch, isProvince, getProvinceByCity, getCitiesByProvince, getProvinces, isDistrictTerminal, isCityTerminal } from "@/utils/neighborhoods";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function NeighborhoodResultsPage() {
  const params = useParams<{ neighborhood?: string; barrio?: string }>();
  const neighborhood = params.barrio || params.neighborhood || '';
  const [, setLocation] = useLocation();
  const [currentLocation] = useLocation();
  const decodedNeighborhood = neighborhood ? decodeURIComponent(neighborhood) : '';
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();
  const { isTransitioning, endTransition } = useRouteTransition();
  
  // State for save search button
  const [isSaveConfirming, setIsSaveConfirming] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // State for mobile filter sheet
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSortBy, setMobileSortBy] = useState<'newest' | 'price-asc' | 'price-m2' | 'price-drop'>('newest');
  
  // State for inline neighborhood rating form
  const [showInlineRatingForm, setShowInlineRatingForm] = useState(false);
  const [inlineUserRatings, setInlineUserRatings] = useState<Record<string, number>>({
    security: 0,
    parking: 0,
    familyFriendly: 0,
    publicTransport: 0,
    greenSpaces: 0,
    services: 0,
  });
  
  // Check for pending saved search after login
  useEffect(() => {
    const pendingSavedSearch = sessionStorage.getItem('pendingSavedSearch');
    if (pendingSavedSearch && user?.isClient) {
      // User just logged in and had a pending search to save
      const searchData = JSON.parse(pendingSavedSearch);
      
      // Clear the pending search immediately
      sessionStorage.removeItem('pendingSavedSearch');
      
      // Show a toast to remind them
      toast({
        title: "Búsqueda lista para guardar",
        description: "Haz clic en 'Guardar búsqueda' para guardar esta búsqueda en tu perfil",
      });
      
      // Auto-trigger the save confirmation
      setIsSaveConfirming(true);
      setTimeout(() => {
        setIsSaveConfirming(false);
      }, 5000);
    }
  }, [user, toast]);
  
  // Parse hierarchical neighborhood format with fallbacks
  // Hierarchy: Province > City > District > Neighborhood
  let currentProvince: string | undefined;
  let currentCity: string | undefined;
  let currentDistrict: string | undefined;
  let currentNeighborhood: string | undefined;
  
  // Try 3-part parsing first (Neighborhood, District, City)
  const locationParts = parseNeighborhoodDisplayName(decodedNeighborhood);
  if (locationParts) {
    currentCity = locationParts.city;
    currentDistrict = locationParts.district;
    currentNeighborhood = locationParts.neighborhood;
    currentProvince = getProvinceByCity(locationParts.city) || undefined;
  } else {
    // Try parsing as "District, City", "City, Province", or single value
    const parts = decodedNeighborhood.split(',').map(p => p.trim());
    
    if (parts.length === 2) {
      const [first, second] = parts;
      
      // Check if it's "City, Province" format
      if (isProvince(second)) {
        currentProvince = second;
        const citiesInProvince = getCitiesByProvince(second);
        if (citiesInProvince.includes(first)) {
          currentCity = first;
          currentDistrict = undefined;
          currentNeighborhood = undefined;
        }
      } else {
        // It's "District, City" format
        const cities = getCities();
        if (cities.includes(second)) {
          const districts = getDistrictsByCity(second);
          if (districts.includes(first)) {
            currentCity = second;
            currentDistrict = first;
            currentNeighborhood = undefined;
            currentProvince = getProvinceByCity(second) || undefined;
          }
        }
      }
    } else if (parts.length === 1) {
      // Check for explicit province suffix "(provincia)" - e.g., "Barcelona (provincia)"
      const provinceMatch = decodedNeighborhood.match(/^(.+?)\s*\(provincia\)$/i);
      if (provinceMatch) {
        const provinceName = provinceMatch[1].trim();
        if (isProvince(provinceName)) {
          currentProvince = provinceName;
          currentCity = undefined;
          currentDistrict = undefined;
          currentNeighborhood = undefined;
        }
      } else {
        // Priority: City > Province > Neighborhood (for backward compatibility)
        // This handles cases like "Barcelona" which is both a province AND a city
        const cities = getCities();
        if (cities.includes(decodedNeighborhood)) {
          // It's a city - prioritize city matching
          currentCity = decodedNeighborhood;
          currentDistrict = undefined;
          currentNeighborhood = undefined;
          currentProvince = getProvinceByCity(decodedNeighborhood) || undefined;
        } else if (isProvince(decodedNeighborhood)) {
          // It's a province (but not a city with same name)
          currentProvince = decodedNeighborhood;
          currentCity = undefined;
          currentDistrict = undefined;
          currentNeighborhood = undefined;
        } else {
          // Fallback: treat as neighborhood and find its context
          currentNeighborhood = decodedNeighborhood;
          // Default to Barcelona for legacy compatibility
          currentCity = 'Barcelona';
          currentDistrict = findDistrictByNeighborhood(decodedNeighborhood, currentCity) || undefined;
          currentProvince = getProvinceByCity(currentCity) || undefined;
        }
      }
    }
  }
  
  // Ensure province is always set when city is known
  if (currentCity && !currentProvince) {
    currentProvince = getProvinceByCity(currentCity) || undefined;
  }
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bedroomsFromUrl = urlParams.get('bedrooms');
  const minPriceFromUrl = urlParams.get('minPrice');
  const maxPriceFromUrl = urlParams.get('maxPrice');
  const operationTypeFromUrl = urlParams.get('operationType');
  
  // Parse bedrooms - could be a single number or comma-separated list
  let defaultBedroomsList: number[] = [];
  if (bedroomsFromUrl) {
    defaultBedroomsList = bedroomsFromUrl.split(',').map(b => parseInt(b)).filter(b => !isNaN(b));
  }
  const defaultBedrooms = defaultBedroomsList.length > 0 ? Math.min(...defaultBedroomsList) : null;
  
  // Filtros para cada pestaña
  const [agenciesFilter, setAgenciesFilter] = useState<string>("best_rating");
  const [agentsFilter, setAgentsFilter] = useState<string>("best_rating");
  
  // Estado para el toggle de vista (lista/mapa)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Filtros específicos para propiedades
  const [propertyFilters, setPropertyFilters] = useState<PropertyFiltersType>({
    operationType: operationTypeFromUrl === "Alquiler" ? "Alquiler" : "Venta",
    propertyType: "Vivienda",
    priceMin: minPriceFromUrl ? parseInt(minPriceFromUrl) : null,
    priceMax: maxPriceFromUrl ? parseInt(maxPriceFromUrl) : null,
    bedrooms: defaultBedrooms,
    bathrooms: null,
    features: []
  });
  
  // Mutation to save search
  const saveSearchMutation = useMutation({
    mutationFn: async () => {
      const searchData = {
        city: currentCity,
        district: currentDistrict || null,
        neighborhood: currentNeighborhood || null,
        operationType: propertyFilters.operationType,
        propertyType: propertyFilters.propertyType,
        priceMin: propertyFilters.priceMin,
        priceMax: propertyFilters.priceMax,
        bedrooms: propertyFilters.bedrooms,
        bathrooms: propertyFilters.bathrooms,
        features: propertyFilters.features || [],
      };
      
      const response = await apiRequest("POST", "/api/saved-searches", searchData);
      return response;
    },
    onSuccess: () => {
      setIsSaved(true);
      setIsSaveConfirming(false);
      toast({
        title: "Búsqueda guardada",
        description: "Puedes acceder a ella desde 'Mis búsquedas' en tu perfil",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      
      // Reset the saved state after 2 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    },
    onError: (error: Error) => {
      setIsSaveConfirming(false);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la búsqueda",
        variant: "destructive",
      });
    },
  });

  // Mutation for inline neighborhood rating
  const inlineRatingMutation = useMutation({
    mutationFn: async (ratingData: Record<string, number | string | null>) => {
      return await apiRequest('POST', '/api/neighborhoods/ratings', ratingData);
    },
    onSuccess: () => {
      toast({
        title: "¡Valoración enviada!",
        description: `Tu valoración para ${decodedNeighborhood} ha sido guardada con éxito.`,
      });
      // Reset form
      setInlineUserRatings({
        security: 0,
        parking: 0,
        familyFriendly: 0,
        publicTransport: 0,
        greenSpaces: 0,
        services: 0,
      });
      setShowInlineRatingForm(false);
      // Invalidate ratings cache to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/neighborhoods/ratings/average'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la valoración",
        variant: "destructive",
      });
    },
  });

  // Handler functions for inline rating
  const handleInlineRatingChange = (key: string, value: number) => {
    setInlineUserRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitInlineRating = () => {
    // Validate at least one rating is provided
    const hasAnyRating = Object.values(inlineUserRatings).some(v => v > 0);
    if (!hasAnyRating) {
      toast({
        title: "Valoración incompleta",
        description: "Por favor, proporciona al menos una valoración.",
        variant: "destructive",
      });
      return;
    }

    inlineRatingMutation.mutate({
      neighborhood: currentNeighborhood || decodedNeighborhood,
      district: currentDistrict || null,
      city: currentCity || null,
      ...inlineUserRatings,
    });
  };

  const handleSaveSearch = () => {
    // Check if user is logged in and is a client
    if (!user?.isClient) {
      // Store current search in sessionStorage to restore after login
      const currentSearch = {
        city: currentCity,
        district: currentDistrict || null,
        neighborhood: currentNeighborhood || null,
        operationType: propertyFilters.operationType,
        propertyType: propertyFilters.propertyType,
        priceMin: propertyFilters.priceMin,
        priceMax: propertyFilters.priceMax,
        bedrooms: propertyFilters.bedrooms,
        bathrooms: propertyFilters.bathrooms,
        features: propertyFilters.features || [],
        returnUrl: window.location.pathname + window.location.search // Full URL with query params
      };
      sessionStorage.setItem('pendingSavedSearch', JSON.stringify(currentSearch));
      
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión como cliente para guardar búsquedas",
      });
      
      // Redirect to login page (Spanish route)
      setLocation('/iniciar-sesion');
      return;
    }
    
    // First click: show confirmation
    if (!isSaveConfirming) {
      setIsSaveConfirming(true);
      // Reset confirmation after 3 seconds if not confirmed
      setTimeout(() => {
        setIsSaveConfirming(false);
      }, 3000);
      return;
    }
    
    // Second click: execute save
    saveSearchMutation.mutate();
  };
  
  // Get display location name for mobile header
  const getMobileLocationName = () => {
    if (currentNeighborhood && currentNeighborhood !== currentCity) {
      return `${currentNeighborhood}, ${currentCity}`;
    }
    if (currentDistrict) {
      return `${currentDistrict}, ${currentCity}`;
    }
    if (currentCity) {
      return currentCity;
    }
    if (currentProvince) {
      return `${currentProvince} (provincia)`;
    }
    return decodedNeighborhood || 'Explorar';
  };
  
  // Verificar si estamos en una página de provincia
  const isProvincePage = currentProvince && !currentCity && !currentDistrict && !currentNeighborhood;
  
  // Verificar si estamos en una página de ciudad general
  const isCityPage = currentCity && !currentDistrict && !currentNeighborhood;
  
  // Verificar si es una página de distrito
  const isDistrictPage = currentCity && currentDistrict && !currentNeighborhood;
  
  // Verificar si es una página de barrio específico
  const isNeighborhoodPage = currentCity && currentNeighborhood && currentNeighborhood !== currentCity;
  
  // CRITICAL FIX: Expand districts to their constituent neighborhoods
  // This ensures agents/properties assigned to specific neighborhoods appear on district pages
  // Province-level search also expands to all neighborhoods in all cities of the province
  // Example: "Sant Andreu" district expands to ["Sant Andreu del Palomar", "La Sagrera", ...]
  // Example: "Barcelona" province expands to all Barcelona city neighborhoods
  const expandedNeighborhoods = expandNeighborhoodSearch(decodedNeighborhood, currentCity || 'Barcelona');
  const effectiveNeighborhood = expandedNeighborhoods.length > 0 
    ? expandedNeighborhoods.join(',') 
    : decodedNeighborhood;
  
  // Determinar el distrito para barrios (para compatibilidad)
  const legacyDistrict = !currentDistrict && currentNeighborhood && currentCity ? findDistrictByNeighborhood(currentNeighborhood, currentCity) : currentDistrict;
  
  // Determinar la pestaña activa según la ruta (Spanish routes)
  const getActiveTab = () => {
    if (currentLocation.includes('/inmuebles')) return 'properties';
    if (currentLocation.includes('/agencias')) return 'agencies';
    if (currentLocation.includes('/agentes')) return 'agents';
    if (currentLocation.includes('/resumen')) return 'overview';
    return 'properties'; // Pestaña por defecto si no hay otra especificada
  };

  const activeTab = getActiveTab();
  
  // Reset map view when switching away from Properties tab on mobile
  useEffect(() => {
    if (activeTab !== 'properties' && viewMode === 'map') {
      setViewMode('list');
    }
  }, [activeTab, viewMode]);
  
  // Preload data for all tabs on component mount for faster switching
  useEffect(() => {
    const preloadData = () => {
      // Preload properties data
      queryClient.prefetchQuery({
        queryKey: ['/api/properties', { 
          neighborhoods: effectiveNeighborhood,
          operationType: propertyFilters.operationType,
          propertyType: propertyFilters.propertyType,
          priceMin: propertyFilters.priceMin,
          priceMax: propertyFilters.priceMax,
          bedrooms: propertyFilters.bedrooms,
          bathrooms: propertyFilters.bathrooms,
          features: propertyFilters.features,
          mostViewed: false
        }],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.append('neighborhoods', effectiveNeighborhood);
          params.append('operationType', propertyFilters.operationType);
          params.append('propertyType', propertyFilters.propertyType);
          params.append('mostViewed', 'false');
          
          if (propertyFilters.priceMin !== null) {
            params.append('priceMin', propertyFilters.priceMin.toString());
          }
          
          if (propertyFilters.priceMax !== null) {
            params.append('priceMax', propertyFilters.priceMax.toString());
          }
          
          if (propertyFilters.bedrooms !== null) {
            params.append('bedrooms', propertyFilters.bedrooms.toString());
          }
          
          if (propertyFilters.bathrooms !== null) {
            params.append('bathrooms', propertyFilters.bathrooms.toString());
          }
          
          if (propertyFilters.features && propertyFilters.features.length > 0) {
            params.append('features', propertyFilters.features.join(','));
          }
          
          const response = await fetch(`/api/properties?${params.toString()}`);
          if (!response.ok) throw new Error(`Failed to fetch properties for ${effectiveNeighborhood}`);
          return response.json();
        },
        staleTime: 300000,
      });

      // Preload agencies data
      queryClient.prefetchQuery({
        queryKey: ['/api/search/agencies', { neighborhoods: effectiveNeighborhood }],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.append('neighborhoods', effectiveNeighborhood);
          const response = await fetch(`/api/search/agencies?${params.toString()}`);
          if (!response.ok) throw new Error(`Failed to fetch agencies for ${effectiveNeighborhood}`);
          return response.json();
        },
        staleTime: 300000,
      });

      // Preload agents data
      queryClient.prefetchQuery({
        queryKey: ['/api/search/agents', { neighborhoods: effectiveNeighborhood }],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.append('neighborhoods', effectiveNeighborhood);
          const response = await fetch(`/api/search/agents?${params.toString()}`);
          if (!response.ok) throw new Error(`Failed to fetch agents for ${effectiveNeighborhood}`);
          return response.json();
        },
        staleTime: 300000,
      });
    };

    // Preload data after a short delay to prioritize current tab
    const timer = setTimeout(preloadData, 500);
    return () => clearTimeout(timer);
  }, [decodedNeighborhood, propertyFilters, queryClient]);

  // Helper to get Spanish route segment from tab value
  const getSpanishTabSegment = (tabValue: string): string => {
    if (tabValue === 'properties') return 'inmuebles';
    if (tabValue === 'agencies') return 'agencias';
    if (tabValue === 'agents') return 'agentes';
    if (tabValue === 'overview') return 'resumen';
    return 'inmuebles'; // Default
  };

  // Optimized tab change using state instead of page reload
  const handleTabChange = (value: string) => {
    const spanishTab = getSpanishTabSegment(value);
    setLocation(`/barrio/${encodeURIComponent(decodedNeighborhood)}/${spanishTab}`);
  };

  // Consultas para propiedades
  const { data: properties, isFetching: propertiesFetching, isError: propertiesError } = useQuery({
    queryKey: ['/api/properties', { 
      neighborhoods: effectiveNeighborhood,
      operationType: propertyFilters.operationType,
      propertyType: propertyFilters.propertyType,
      priceMin: propertyFilters.priceMin,
      priceMax: propertyFilters.priceMax,
      bedrooms: propertyFilters.bedrooms,
      bathrooms: propertyFilters.bathrooms,
      features: propertyFilters.features,
      mostViewed: false
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      params.append('operationType', propertyFilters.operationType);
      params.append('propertyType', propertyFilters.propertyType);
      params.append('mostViewed', 'false');
      
      if (propertyFilters.priceMin !== null) {
        params.append('priceMin', propertyFilters.priceMin.toString());
      }
      
      if (propertyFilters.priceMax !== null) {
        params.append('priceMax', propertyFilters.priceMax.toString());
      }
      
      if (propertyFilters.bedrooms !== null) {
        params.append('bedrooms', propertyFilters.bedrooms.toString());
      }
      
      if (propertyFilters.bathrooms !== null) {
        params.append('bathrooms', propertyFilters.bathrooms.toString());
      }
      
      // Add feature filters if they exist
      if (propertyFilters.features && propertyFilters.features.length > 0) {
        params.append('features', propertyFilters.features.join(','));
      }
      
      console.log(`Fetching properties with operationType: ${propertyFilters.operationType}, propertyType: ${propertyFilters.propertyType}`);
      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch properties for ${effectiveNeighborhood}`);
      return response.json();
    },
    staleTime: 600000, // 10 minutes cache for better performance
    gcTime: 900000, // 15 minutes in cache
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Consultas para agencias
  const { data: agencies, isFetching: agenciesFetching, isError: agenciesError } = useQuery({
    queryKey: ['/api/search/agencies', { neighborhoods: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      const response = await fetch(`/api/search/agencies?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agencies for ${effectiveNeighborhood}`);
      return response.json();
    },
    staleTime: 600000, // 10 minutes cache for better performance
    gcTime: 900000, // 15 minutes in cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Consultas para agentes
  const { data: agents, isFetching: agentsFetching, isError: agentsError } = useQuery({
    queryKey: ['/api/search/agents', { neighborhoods: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      const response = await fetch(`/api/search/agents?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agents for ${effectiveNeighborhood}`);
      return response.json();
    },
    staleTime: 600000, // 10 minutes cache for better performance
    gcTime: 900000, // 15 minutes in cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // Consulta para las valoraciones del barrio
  const { data: ratings, isFetching: ratingsFetching, refetch: refetchRatings } = useQuery({
    queryKey: ['/api/neighborhoods/ratings/average', { neighborhood: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhood', effectiveNeighborhood);
      
      const response = await fetch(`/api/neighborhoods/ratings/average?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch ratings for ${effectiveNeighborhood}`);
      const data = await response.json();
      console.log('Ratings response data:', data);
      return data;
    },
    enabled: Boolean(isNeighborhoodPage), // Only enabled for specific neighborhoods
    staleTime: 600000, // 10 minutes cache - neighborhood ratings change rarely
    gcTime: 1200000, // 20 minutes in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Combine isFetching states with route transition for skeleton visibility
  const showPropertiesSkeleton = useSkeletonVisibility({ 
    isFetching: propertiesFetching, 
    isTransitioning 
  });
  const showAgenciesSkeleton = useSkeletonVisibility({ 
    isFetching: agenciesFetching, 
    isTransitioning 
  });
  const showAgentsSkeleton = useSkeletonVisibility({ 
    isFetching: agentsFetching, 
    isTransitioning 
  });

  // End transition when data is ready
  useEffect(() => {
    const anyFetching = propertiesFetching || agenciesFetching || agentsFetching || ratingsFetching;
    const anyError = propertiesError || agenciesError || agentsError;
    
    if (isTransitioning && !anyFetching) {
      endTransition();
    } else if (anyError && isTransitioning) {
      endTransition();
    }
  }, [isTransitioning, propertiesFetching, agenciesFetching, agentsFetching, ratingsFetching, 
      propertiesError, agenciesError, agentsError, endTransition]);

  return (
    <div className="min-h-screen flex flex-col pt-16 pb-16 md:pb-0">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden sticky top-16 z-30 bg-white border-b">
        <MobileSearchHeader
          locationName={getMobileLocationName()}
          propertyCount={properties?.length || 0}
        />
        <MobileFilterRow
          activeTab={activeTab}
          onTabChange={(tab) => handleTabChange(tab)}
          propertySortBy={mobileSortBy}
          onPropertySortChange={(sort) => {
            setMobileSortBy(sort);
            setPropertyFilters(prev => ({ ...prev, sortBy: sort }));
          }}
          entitySortBy={activeTab === 'agencies' ? agenciesFilter as 'best_rating' | 'most_reviews' : agentsFilter as 'best_rating' | 'most_reviews'}
          onEntitySortChange={(sort) => {
            if (activeTab === 'agencies') {
              setAgenciesFilter(sort);
            } else if (activeTab === 'agents') {
              setAgentsFilter(sort);
            }
          }}
          onOpenFilters={() => setIsMobileFilterOpen(true)}
        />
      </div>

      {/* Mobile Filter Sheet - Contains PropertyFilters component */}
      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      >
        <PropertyFilters 
          onFilterChange={(filters) => {
            setPropertyFilters(filters);
            setIsMobileFilterOpen(false);
          }}
          defaultOperationType={propertyFilters.operationType}
          defaultBedrooms={defaultBedrooms}
          defaultBedroomsList={defaultBedroomsList}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={false}
        />
      </MobileFilterSheet>

      {/* Floating Map Button - Mobile only */}
      {activeTab === 'properties' && (
        <FloatingMapButton
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          isMapView={viewMode === 'map'}
        />
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Desktop Breadcrumb - Hidden on mobile */}
        <div className="mb-6 hidden md:block">
          {/* Hierarchical Breadcrumb Navigation: Inicio > Province > City > District > Neighborhood */}
          <div className="flex items-center flex-wrap text-sm text-gray-500 mb-4">
            {/* Inicio - Always at top level */}
            <span 
              className="cursor-pointer hover:text-primary"
              onClick={() => setLocation('/')}
              data-testid="breadcrumb-inicio"
            >
              Inicio
            </span>
            
            {/* Province Level with cities dropdown */}
            {currentProvince && (
              <>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span className="cursor-pointer hover:text-primary underline-offset-4 hover:underline" data-testid="breadcrumb-province">
                      {currentProvince} provincia
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto">
                    {getCitiesByProvince(currentProvince).map(cityOption => (
                      <DropdownMenuItem
                        key={cityOption}
                        onClick={() => setLocation(`/barrio/${encodeURIComponent(cityOption)}, ${encodeURIComponent(currentProvince)}/${getSpanishTabSegment(activeTab)}`)}
                        className="cursor-pointer"
                        data-testid={`breadcrumb-city-${cityOption}`}
                      >
                        {cityOption}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => setLocation(`/barrio/${encodeURIComponent(currentProvince + ' (provincia)')}/${getSpanishTabSegment(activeTab)}`)}
                      className="cursor-pointer border-t mt-1 pt-2 font-medium"
                      data-testid="breadcrumb-province-all"
                    >
                      Ver toda la provincia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {/* City Level with district dropdown (or just text for terminal cities) */}
            {currentCity && (
              <>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                {isCityTerminal(currentCity) ? (
                  /* Terminal city - no districts, show as final level */
                  <span className="text-gray-900 font-medium" data-testid="breadcrumb-city">
                    {currentCity}
                  </span>
                ) : (
                  /* Regular city with districts - show dropdown */
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span className="cursor-pointer hover:text-primary underline-offset-4 hover:underline" data-testid="breadcrumb-city">
                        {currentCity}
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto">
                      {getDistrictsByCity(currentCity).map(districtOption => (
                        <DropdownMenuItem
                          key={districtOption}
                          onClick={() => setLocation(`/barrio/${encodeURIComponent(districtOption)}, ${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`)}
                          className="cursor-pointer"
                          data-testid={`breadcrumb-district-${districtOption}`}
                        >
                          {districtOption}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => setLocation(`/barrio/${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`)}
                        className="cursor-pointer border-t mt-1 pt-2 font-medium"
                        data-testid="breadcrumb-city-all"
                      >
                        Ver todo {currentCity}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            
            {/* District Level with neighborhood dropdown (or just text for terminal districts) */}
            {currentDistrict && currentCity && (
              <>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                {isDistrictTerminal(currentDistrict, currentCity) ? (
                  /* Terminal district - no neighborhoods, show as final level */
                  <span className="text-gray-900 font-medium" data-testid="breadcrumb-district">
                    {currentDistrict}
                  </span>
                ) : (
                  /* Regular district with neighborhoods - show dropdown */
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span className="cursor-pointer hover:text-primary underline-offset-4 hover:underline" data-testid="breadcrumb-district">
                        {currentDistrict}
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto">
                      {getNeighborhoodsByDistrict(currentDistrict, currentCity).map(neighborhoodOption => (
                        <DropdownMenuItem
                          key={neighborhoodOption}
                          onClick={() => setLocation(`/barrio/${encodeURIComponent(neighborhoodOption)}, ${encodeURIComponent(currentDistrict)}, ${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`)}
                          className="cursor-pointer"
                          data-testid={`breadcrumb-neighborhood-${neighborhoodOption}`}
                        >
                          {neighborhoodOption}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => setLocation(`/barrio/${encodeURIComponent(currentDistrict)}, ${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`)}
                        className="cursor-pointer border-t mt-1 pt-2 font-medium"
                        data-testid="breadcrumb-district-all"
                      >
                        Ver todo {currentDistrict}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            
            {/* Neighborhood Level */}
            {currentNeighborhood && currentNeighborhood !== currentCity && (
              <>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                <span className="text-gray-900 font-medium">
                  {currentNeighborhood}
                </span>
              </>
            )}
            
          </div>
        </div>
          
          
          
        {/* Tabs para diferentes tipos de resultados */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Desktop Tab List - Hidden on mobile since we use dropdown in MobileFilterRow */}
            <TabsList className="hidden md:grid grid-cols-4 mb-8">
              <TabsTrigger value="properties" className="flex items-center gap-1">
                <HomeIcon className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="agencies" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Agencias
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Descripción
              </TabsTrigger>
            </TabsList>

            {/* Contenido de pestaña: Propiedades */}
            <TabsContent value="properties" className="mt-0">
              {/* Filtros de propiedades con toggle de vista integrado - hidden on mobile */}
              <div className="hidden md:block">
                <PropertyFilters 
                  onFilterChange={setPropertyFilters}
                  defaultOperationType={propertyFilters.operationType}
                  defaultBedrooms={defaultBedrooms}
                  defaultBedroomsList={defaultBedroomsList}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  showViewToggle={true}
                  saveSearchButton={
                    <Button
                      onClick={handleSaveSearch}
                      disabled={saveSearchMutation.isPending || isSaved}
                      variant={isSaveConfirming ? "default" : isSaved ? "default" : "outline"}
                      size="sm"
                      data-testid="button-save-search"
                      className="gap-2"
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-4 w-4" />
                          Guardada
                        </>
                      ) : isSaveConfirming ? (
                        <>
                          <Check className="h-4 w-4" />
                          Confirmar guardar
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4" />
                          Guardar búsqueda
                        </>
                      )}
                    </Button>
                  }
                />
              </div>

              {/* Contenido condicional basado en el modo de vista */}
              {viewMode === 'list' ? (
                <PropertyResults 
                  results={useMemo(() => {
                    if (!properties) return [];
                    
                    const sortedProperties = [...properties];
                    
                    // Use the sortBy from propertyFilters instead of the removed propertiesFilter
                    switch (propertyFilters.sortBy) {
                      case 'price-asc':
                        return sortedProperties.sort((a, b) => a.price - b.price);
                      case 'price-m2':
                        return sortedProperties.sort((a, b) => {
                          const pricePerM2A = a.superficie ? a.price / a.superficie : Infinity;
                          const pricePerM2B = b.superficie ? b.price / b.superficie : Infinity;
                          return pricePerM2A - pricePerM2B;
                        });
                      case 'price-drop':
                        return sortedProperties.sort((a, b) => {
                          const dropA = a.previousPrice ? ((a.previousPrice - a.price) / a.previousPrice) * 100 : 0;
                          const dropB = b.previousPrice ? ((b.previousPrice - b.price) / b.previousPrice) * 100 : 0;
                          return dropB - dropA; // Mayor a menor
                        });
                      case 'newest':
                      default:
                        // Default: sort by newest (created_at desc)
                        return sortedProperties.sort((a, b) => 
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                    }
                  }, [properties, propertyFilters.sortBy]) || []} 
                  showSkeleton={showPropertiesSkeleton} 
                />
              ) : (
                <GoogleMapsNeighborhoodMap
                  properties={useMemo(() => {
                    if (!properties) return [];
                    
                    const sortedProperties = [...properties];
                    
                    // Apply the same sorting logic as the list view
                    switch (propertyFilters.sortBy) {
                      case 'price-asc':
                        return sortedProperties.sort((a, b) => a.price - b.price);
                      case 'price-m2':
                        return sortedProperties.sort((a, b) => {
                          const pricePerM2A = a.superficie ? a.price / a.superficie : Infinity;
                          const pricePerM2B = b.superficie ? b.price / b.superficie : Infinity;
                          return pricePerM2A - pricePerM2B;
                        });
                      case 'price-drop':
                        return sortedProperties.sort((a, b) => {
                          const dropA = a.previousPrice ? ((a.previousPrice - a.price) / a.previousPrice) * 100 : 0;
                          const dropB = b.previousPrice ? ((b.previousPrice - b.price) / b.previousPrice) * 100 : 0;
                          return dropB - dropA; // Mayor a menor
                        });
                      case 'newest':
                      default:
                        // Default: sort by newest (created_at desc)
                        return sortedProperties.sort((a, b) => 
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                    }
                  }, [properties, propertyFilters.sortBy]) || []}
                  neighborhood={decodedNeighborhood}
                />
              )}
            </TabsContent>



            {/* Contenido de pestaña: Agencias */}
            <TabsContent value="agencies" className="mt-0">
              {/* Desktop sort selector - hidden on mobile since MobileFilterRow handles it */}
              <div className="mb-4 hidden md:flex justify-end">
                <Select
                  value={agenciesFilter}
                  onValueChange={setAgenciesFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_rating">Mejor puntuación</SelectItem>
                    <SelectItem value="newest_reviews">Más recientes</SelectItem>
                    <SelectItem value="most_reviews">Más reseñas</SelectItem>
                    <SelectItem value="most_properties">Más propiedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AgencyResults 
                results={useMemo(() => {
                  if (!agencies) return [];
                  
                  const sortedAgencies = [...agencies];
                  
                  switch (agenciesFilter) {
                    case 'best_rating':
                      return sortedAgencies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    case 'newest_reviews':
                      return sortedAgencies.sort((a, b) => 
                        (b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0) - 
                        (a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0)
                      );
                    case 'most_reviews':
                      return sortedAgencies.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                    case 'most_properties':
                      return sortedAgencies.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
                    default:
                      return sortedAgencies;
                  }
                }, [agencies, agenciesFilter]) || []} 
                showSkeleton={showAgenciesSkeleton} 
              />
            </TabsContent>

            {/* Contenido de pestaña: Agentes */}
            <TabsContent value="agents" className="mt-0">
              {/* Desktop sort selector - hidden on mobile since MobileFilterRow handles it */}
              <div className="mb-4 hidden md:flex justify-end">
                <Select
                  value={agentsFilter}
                  onValueChange={setAgentsFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_rating">Mejor puntuación</SelectItem>
                    <SelectItem value="newest_reviews">Más recientes</SelectItem>
                    <SelectItem value="most_reviews">Más reseñas</SelectItem>
                    <SelectItem value="most_properties">Más propiedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AgentResults 
                results={useMemo(() => {
                  if (!agents) return [];
                  
                  const sortedAgents = [...agents];
                  
                  switch (agentsFilter) {
                    case 'best_rating':
                      return sortedAgents.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    case 'newest_reviews':
                      return sortedAgents.sort((a, b) => 
                        (b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0) - 
                        (a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0)
                      );
                    case 'most_reviews':
                      return sortedAgents.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                    case 'most_properties':
                      return sortedAgents.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
                    default:
                      return sortedAgents;
                  }
                }, [agents, agentsFilter]) || []} 
                showSkeleton={showAgentsSkeleton} 
              />
            </TabsContent>

            {/* Contenido de pestaña: Overview */}
            <TabsContent value="overview" className="mt-0">
              {/* Dynamic title based on hierarchical structure */}
              {isProvincePage && currentProvince && (
                <h2 className="text-2xl font-bold mb-4">Provincia de {currentProvince}</h2>
              )}
              {isCityPage && (
                <h2 className="text-2xl font-bold mb-4">{currentCity}</h2>
              )}
              {isDistrictPage && (
                <h2 className="text-2xl font-bold mb-4">Distrito de {currentDistrict}</h2>
              )}
              {isNeighborhoodPage && (
                <h2 className="text-2xl font-bold mb-4">Barrio de {currentNeighborhood}</h2>
              )}
              
                {/* Province information when viewing a province */}
                {isProvincePage && currentProvince && (
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      La provincia de {currentProvince} incluye las siguientes ciudades:
                    </p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getCitiesByProvince(currentProvince).map(cityOption => (
                        <span 
                          key={cityOption}
                          className="bg-gray-100 px-3 py-2 rounded text-sm cursor-pointer hover:bg-primary/10 flex items-center justify-center text-center"
                          onClick={() => setLocation(`/barrio/${encodeURIComponent(cityOption)}, ${encodeURIComponent(currentProvince)}/${getSpanishTabSegment(activeTab)}`)}
                          data-testid={`province-city-link-${cityOption}`}
                        >
                          {cityOption}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* District information when viewing a district */}
                {isDistrictPage && currentDistrict && currentCity && (
                  <div className="mb-6">
                    {isDistrictTerminal(currentDistrict, currentCity) ? (
                      /* Terminal district - no neighborhoods subdivision */
                      <p className="text-gray-600">
                        El distrito de {currentDistrict} es una zona sin subdivisiones de barrios.
                      </p>
                    ) : (
                      /* Regular district with neighborhoods */
                      <>
                        <p className="text-gray-600">
                          El distrito de {currentDistrict} incluye los siguientes barrios:
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getNeighborhoodsByDistrict(currentDistrict, currentCity).map(neighborhood => (
                            <span 
                              key={neighborhood}
                              className="bg-gray-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-primary/10"
                              onClick={() => {
                                setLocation(`/barrio/${encodeURIComponent(neighborhood)}, ${encodeURIComponent(currentDistrict)}, ${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`);
                              }}
                              data-testid={`district-neighborhood-link-${neighborhood}`}
                            >
                              {neighborhood}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* City information when viewing a city */}
                {isCityPage && currentCity && (
                  <div className="mb-6">
                    {isCityTerminal(currentCity) ? (
                      /* Terminal city - no districts subdivision */
                      <p className="text-gray-600">
                        {currentCity} es una localidad sin subdivisiones de distritos.
                      </p>
                    ) : (
                      /* Regular city with districts */
                      <>
                        <p className="text-gray-600 mb-4">
                          {currentCity === 'Barcelona' ? 'Barcelona está dividida en los siguientes distritos:' : 
                           currentCity === 'Madrid' ? 'Madrid cuenta con los siguientes distritos:' :
                           `${currentCity} está dividida en los siguientes distritos:`}
                        </p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {getDistrictsByCity(currentCity).map(districtOption => (
                            <span 
                              key={districtOption}
                              className="bg-gray-100 px-3 py-2 rounded text-sm cursor-pointer hover:bg-primary/10 flex items-center justify-center text-center"
                              onClick={() => setLocation(`/barrio/${encodeURIComponent(districtOption)}, ${encodeURIComponent(currentCity)}/${getSpanishTabSegment(activeTab)}`)}
                              data-testid={`city-district-link-${districtOption}`}
                            >
                              {districtOption}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Información genérica del barrio */}
                {isNeighborhoodPage && (
                  <>
                    {/* Valoraciones del barrio */}
                    {!ratingsFetching && ratings && (
                      <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-500" />
                          Valoraciones del barrio
                          {ratings.count > 0 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({ratings.count} {ratings.count === 1 ? 'valoración' : 'valoraciones'})
                            </span>
                          )}
                        </h3>
                        
                        {ratings.count > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Seguridad:</span>
                              <span className="text-xs font-bold">{ratings.security}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Aparcamiento:</span>
                              <span className="text-xs font-bold">{ratings.parking}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Familias:</span>
                              <span className="text-xs font-bold">{ratings.familyFriendly}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Transporte:</span>
                              <span className="text-xs font-bold">{ratings.publicTransport}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Espacios verdes:</span>
                              <span className="text-xs font-bold">{ratings.greenSpaces}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Servicios:</span>
                              <span className="text-xs font-bold">{ratings.services}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {ratings.count > 0 ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Sensación de seguridad</span>
                                    <span className="text-sm font-semibold">{ratings.security}/10</span>
                                  </div>
                                  <Progress value={ratings.security * 10} className="h-2" />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Facilidad de aparcar</span>
                                    <span className="text-sm font-semibold">{ratings.parking}/10</span>
                                  </div>
                                  <Progress value={ratings.parking * 10} className="h-2" />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Amigable para peques</span>
                                    <span className="text-sm font-semibold">{ratings.familyFriendly}/10</span>
                                  </div>
                                  <Progress value={ratings.familyFriendly * 10} className="h-2" />
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Conexión con transporte público</span>
                                    <span className="text-sm font-semibold">{ratings.publicTransport}/10</span>
                                  </div>
                                  <Progress value={ratings.publicTransport * 10} className="h-2" />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Parques y espacios verdes</span>
                                    <span className="text-sm font-semibold">{ratings.greenSpaces}/10</span>
                                  </div>
                                  <Progress value={ratings.greenSpaces * 10} className="h-2" />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Disponibilidad de servicios</span>
                                    <span className="text-sm font-semibold">{ratings.services}/10</span>
                                  </div>
                                  <Progress value={ratings.services * 10} className="h-2" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Button to add new rating or inline form */}
                            {!showInlineRatingForm ? (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <Button 
                                  variant="outline" 
                                  className="text-primary border-primary hover:bg-primary/10" 
                                  onClick={() => setShowInlineRatingForm(true)}
                                  data-testid="btn-add-rating"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Califica este barrio
                                </Button>
                              </div>
                            ) : (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold">
                                      Califica: {decodedNeighborhood}
                                    </h4>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setShowInlineRatingForm(false)}
                                      data-testid="btn-close-inline-rating-existing"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-5">
                                    {[
                                      { key: 'security', label: 'Seguridad', icon: '🔒' },
                                      { key: 'parking', label: 'Aparcamiento', icon: '🚗' },
                                      { key: 'familyFriendly', label: 'Ambiente familiar', icon: '👨‍👩‍👧‍👦' },
                                      { key: 'publicTransport', label: 'Conectividad', icon: '🚌' },
                                      { key: 'greenSpaces', label: 'Zonas verdes', icon: '🌳' },
                                      { key: 'services', label: 'Servicios', icon: '🛍️' },
                                    ].map(({ key, label, icon }) => (
                                      <div key={key} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">{icon}</span>
                                          <label className="text-sm font-medium text-gray-700">
                                            {label}
                                          </label>
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              disabled={inlineRatingMutation.isPending}
                                              className={`text-lg ${inlineRatingMutation.isPending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                              onClick={() => handleInlineRatingChange(key, star)}
                                              data-testid={`star-existing-${key}-${star}`}
                                            >
                                              <Star 
                                                className={`h-5 w-5 ${
                                                  inlineUserRatings[key] >= star
                                                    ? 'text-yellow-500 fill-yellow-500'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            </button>
                                          ))}
                                          <span className="ml-2 text-sm text-gray-600 font-medium">
                                            {inlineUserRatings[key] > 0 ? `${inlineUserRatings[key]}/10` : 'Sin calificar'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <div className="flex gap-3 pt-4">
                                      <Button
                                        onClick={handleSubmitInlineRating}
                                        disabled={inlineRatingMutation.isPending}
                                        className="bg-[#0284c5e6] text-white px-6 py-2"
                                        data-testid="btn-submit-inline-rating-existing"
                                      >
                                        {inlineRatingMutation.isPending ? "Enviando..." : "Enviar valoración"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setShowInlineRatingForm(false)}
                                        disabled={inlineRatingMutation.isPending}
                                        data-testid="btn-cancel-inline-rating-existing"
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-4">
                            {!showInlineRatingForm ? (
                              <div className="text-center py-6 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No hay valoraciones para este barrio todavía.</p>
                                <Button 
                                  variant="link" 
                                  className="mt-3 text-primary hover:underline cursor-pointer font-medium" 
                                  onClick={() => setShowInlineRatingForm(true)}
                                  data-testid="btn-first-rating"
                                >
                                  Sé el primero en valorar este barrio
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-lg font-semibold">
                                    Califica: {decodedNeighborhood}
                                  </h4>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowInlineRatingForm(false)}
                                    data-testid="btn-close-inline-rating"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-5">
                                  {[
                                    { key: 'security', label: 'Seguridad', icon: '🔒' },
                                    { key: 'parking', label: 'Aparcamiento', icon: '🚗' },
                                    { key: 'familyFriendly', label: 'Ambiente familiar', icon: '👨‍👩‍👧‍👦' },
                                    { key: 'publicTransport', label: 'Conectividad', icon: '🚌' },
                                    { key: 'greenSpaces', label: 'Zonas verdes', icon: '🌳' },
                                    { key: 'services', label: 'Servicios', icon: '🛍️' },
                                  ].map(({ key, label, icon }) => (
                                    <div key={key} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{icon}</span>
                                        <label className="text-sm font-medium text-gray-700">
                                          {label}
                                        </label>
                                      </div>
                                      <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            disabled={inlineRatingMutation.isPending}
                                            className={`text-lg ${inlineRatingMutation.isPending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                            onClick={() => handleInlineRatingChange(key, star)}
                                            data-testid={`star-${key}-${star}`}
                                          >
                                            <Star 
                                              className={`h-5 w-5 ${
                                                inlineUserRatings[key] >= star
                                                  ? 'text-yellow-500 fill-yellow-500'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600 font-medium">
                                          {inlineUserRatings[key] > 0 ? `${inlineUserRatings[key]}/10` : 'Sin calificar'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <div className="flex gap-3 pt-4">
                                    <Button
                                      onClick={handleSubmitInlineRating}
                                      disabled={inlineRatingMutation.isPending}
                                      className="bg-[#0284c5e6] text-white px-6 py-2"
                                      data-testid="btn-submit-inline-rating"
                                    >
                                      {inlineRatingMutation.isPending ? "Enviando..." : "Enviar valoración"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowInlineRatingForm(false)}
                                      disabled={inlineRatingMutation.isPending}
                                      data-testid="btn-cancel-inline-rating"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Propiedades</h3>
                    <p className="text-sm text-gray-600">
                      {properties?.length || 0} propiedades disponibles
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agencias</h3>
                    <p className="text-sm text-gray-600">
                      {agencies?.length || 0} agencias inmobiliarias
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agentes</h3>
                    <p className="text-sm text-gray-600">
                      {agents?.length || 0} agentes especializados
                    </p>
                  </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      
      {/* Footer - Only on neighborhood pages, hidden on mobile */}
      <footer className="mt-auto hidden md:block">
        <Footer />
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}