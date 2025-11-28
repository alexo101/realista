import { useEffect, useRef, useState, useCallback } from 'react';
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';
import { loadGoogleMaps } from '../utils/googleMaps';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';

declare global {
  interface Window {
    __handlePropertyFavorite?: (propertyUuid: string, buttonId: string) => void;
  }
}

interface Property {
  uuid: string;
  title: string | null;
  address: string;
  neighborhood: string;
  price: number;
  operationType: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  superficie?: number | null;
  imageUrls?: string[] | null;
}

interface GoogleMapsNeighborhoodMapProps {
  neighborhood: string;
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onPropertyClick?: (property: Property) => void;
}

export default function GoogleMapsNeighborhoodMap({ 
  neighborhood, 
  properties, 
  center, 
  zoom = 14,
  onPropertyClick 
}: GoogleMapsNeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<number, GeocodingResult>>(new Map());
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set());
  
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Handle favorite toggle from map popup
  const handleFavoriteToggle = useCallback(async (propertyUuid: string, buttonId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar propiedades como favoritas",
        variant: "destructive",
      });
      navigate("/iniciar-sesion");
      return;
    }

    if (!user.isClient) {
      toast({
        title: "Función solo para clientes",
        description: "Solo los clientes pueden agregar propiedades a favoritos",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/clients/favorites/properties/${propertyUuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar favoritos");
      }

      const data = await response.json();
      
      // Update local state
      setFavoriteProperties(prev => {
        const newSet = new Set(prev);
        if (data.isFavorite) {
          newSet.add(propertyUuid);
        } else {
          newSet.delete(propertyUuid);
        }
        return newSet;
      });

      // Update button visual state
      const btn = document.getElementById(buttonId);
      if (btn) {
        btn.dataset.fav = data.isFavorite ? 'true' : 'false';
        btn.innerHTML = data.isFavorite 
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
      }

      // Invalidate client favorites queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user.id}/favorites/properties`] 
      });

      toast({
        title: data.isFavorite ? "Propiedad agregada a favoritos" : "Propiedad eliminada de favoritos",
        description: data.isFavorite 
          ? "La propiedad ha sido agregada a tu lista de favoritos" 
          : "La propiedad ha sido eliminada de tu lista de favoritos",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar favoritos",
        variant: "destructive",
      });
    }
  }, [user, toast, navigate]);

  // Set up global handler for map popup favorite buttons
  useEffect(() => {
    window.__handlePropertyFavorite = handleFavoriteToggle;
    return () => {
      delete window.__handlePropertyFavorite;
    };
  }, [handleFavoriteToggle]);

  // Get coordinates for the neighborhood
  const getNeighborhoodCenter = (): [number, number] => {
    if (center) return center;
    return getFallbackCoordinates(neighborhood);
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMaps();
        
        const [lat, lng] = getNeighborhoodCenter();
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true
        });

        setIsMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [neighborhood, zoom]);

  // Geocode property addresses when properties change
  useEffect(() => {
    if (properties.length === 0) {
      setIsLoading(false);
      return;
    }

    const geocodeProperties = async () => {
      setIsLoading(true);
      
      const addressesToGeocode = properties.map(property => ({
        address: property.address,
        neighborhood: property.neighborhood,
        id: property.uuid
      }));

      try {
        const geocodedResults = await geocodeAddresses(addressesToGeocode);
        setGeocodedCoords(geocodedResults);
      } catch (error) {
        console.error('Error geocoding addresses:', error);
        // Continue with fallback coordinates
      }
      
      setIsLoading(false);
    };

    geocodeProperties();
  }, [properties]);

  // Add markers when map is ready and geocoding is done
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Add markers for each property
    properties.forEach(property => {
      const geocoded = geocodedCoords.get(property.uuid);
      let position: { lat: number; lng: number };

      if (geocoded) {
        position = { lat: geocoded.lat, lng: geocoded.lng };
      } else {
        // Use fallback coordinates with small randomization to avoid overlapping markers
        const fallback = getFallbackCoordinates(property.neighborhood);
        const offsetLat = ((parseInt(property.uuid.replace(/\D/g, '').slice(-5)) * 7) % 100 - 50) * 0.003; // ±0.15 degrees ≈ ±170m
        const offsetLng = ((parseInt(property.uuid.replace(/\D/g, '').slice(-5)) * 13) % 100 - 50) * 0.003;
        position = { lat: fallback[0] + offsetLat, lng: fallback[1] + offsetLng };
      }

      // Create custom marker icon based on operation type
      const markerColor = property.operationType.toLowerCase() === 'venta' ? '#ef4444' : '#3b82f6';
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: property.title || property.address
      });

      // Create info window content with image carousel
      const propertyId = property.uuid.replace(/-/g, '');
      const images = property.imageUrls && property.imageUrls.length > 0 
        ? property.imageUrls 
        : ['/placeholder-property.jpg'];
      const hasMultipleImages = images.length > 1;
      
      const infoContent = `
        <div style="width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; border-radius: 12px;">
          <!-- Image Carousel -->
          <div style="position: relative; width: 100%; height: 240px; background: #f3f4f6;">
            <div id="carousel-${propertyId}" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
              ${images.map((img: string, idx: number) => `
                <img 
                  src="${img}" 
                  alt="Imagen ${idx + 1}"
                  id="img-${propertyId}-${idx}"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease; opacity: ${idx === 0 ? '1' : '0'};"
                  onerror="this.src='/placeholder-property.jpg'"
                />
              `).join('')}
            </div>
            
            ${hasMultipleImages ? `
              <!-- Navigation Arrows -->
              <button 
                onclick="(function() {
                  var total = ${images.length};
                  var current = parseInt(document.getElementById('carousel-${propertyId}').dataset.current || '0');
                  var next = (current - 1 + total) % total;
                  for(var i = 0; i < total; i++) {
                    document.getElementById('img-${propertyId}-' + i).style.opacity = i === next ? '1' : '0';
                  }
                  document.getElementById('carousel-${propertyId}').dataset.current = next;
                  document.getElementById('counter-${propertyId}').textContent = (next + 1) + '/${images.length}';
                  event.stopPropagation();
                })()"
                style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;"
                onmouseover="this.style.background='white'"
                onmouseout="this.style.background='rgba(255,255,255,0.95)'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button 
                onclick="(function() {
                  var total = ${images.length};
                  var current = parseInt(document.getElementById('carousel-${propertyId}').dataset.current || '0');
                  var next = (current + 1) % total;
                  for(var i = 0; i < total; i++) {
                    document.getElementById('img-${propertyId}-' + i).style.opacity = i === next ? '1' : '0';
                  }
                  document.getElementById('carousel-${propertyId}').dataset.current = next;
                  document.getElementById('counter-${propertyId}').textContent = (next + 1) + '/${images.length}';
                  event.stopPropagation();
                })()"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;"
                onmouseover="this.style.background='white'"
                onmouseout="this.style.background='rgba(255,255,255,0.95)'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              
              <!-- Image Counter -->
              <div 
                id="counter-${propertyId}"
                style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;"
              >1/${images.length}</div>
            ` : ''}
            
            <!-- Favorite Button -->
            <button 
              id="fav-${propertyId}"
              onclick="(function() {
                event.stopPropagation();
                if (window.__handlePropertyFavorite) {
                  window.__handlePropertyFavorite('${property.uuid}', 'fav-${propertyId}');
                }
              })()"
              data-fav="${favoriteProperties.has(property.uuid) ? 'true' : 'false'}"
              style="position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.4); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s;"
              onmouseover="this.style.transform='scale(1.1)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              ${favoriteProperties.has(property.uuid) 
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
              }
            </button>
            
            <!-- Operation Type Badge -->
            <span style="position: absolute; top: 10px; left: 10px; background: ${markerColor}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              ${property.operationType}
            </span>
          </div>
          
          <!-- Property Details -->
          <div style="padding: 12px;">
            <!-- Title -->
            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1f2937; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${property.title || property.address}
            </h3>
            
            <!-- Price -->
            <div style="font-size: 20px; font-weight: 700; color: ${markerColor}; margin-bottom: 10px;">
              €${property.price.toLocaleString('es-ES')}${property.operationType === 'Alquiler' ? '<span style="font-size: 13px; font-weight: 400; color: #6b7280;">/mes</span>' : ''}
            </div>
            
            <!-- Features Row -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 10px 0; border-top: 1px solid #f3f4f6;">
              ${property.bedrooms ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                    <path d="M2 4v16m20-16v16M7 9h10M7 9v6h10V9M4 9h2m12 0h2"/>
                  </svg>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${property.bedrooms} hab.</span>
                </div>
              ` : ''}
              ${property.superficie ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 3v18"/>
                  </svg>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${property.superficie} m²</span>
                </div>
              ` : ''}
              ${property.bathrooms ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                    <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h3v2.25"/>
                  </svg>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${property.bathrooms} baño${property.bathrooms > 1 ? 's' : ''}</span>
                </div>
              ` : ''}
            </div>
            
            <!-- View Details Button -->
            <button 
              onclick="window.location.href='/inmueble/${property.uuid}'" 
              style="width: 100%; background: ${markerColor}; color: white; border: none; border-radius: 8px; padding: 12px 16px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: all 0.2s;"
              onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)'"
              onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'"
            >
              Ver detalles
            </button>
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers if there are properties
    if (properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Set minimum zoom if there's only one property
      if (properties.length === 1) {
        mapInstanceRef.current.setZoom(Math.max(zoom, 16));
      }
    }

  }, [properties, isLoading, onPropertyClick, geocodedCoords, isMapReady, zoom]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-sm">
              Cargando mapa y ubicaciones...
            </div>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
        data-testid="google-maps-container"
      />
    </div>
  );
}