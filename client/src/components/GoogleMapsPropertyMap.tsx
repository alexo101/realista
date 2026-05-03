import { useEffect, useMemo, useRef, useState } from "react";
import { type Property } from "@shared/schema";
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';
import { loadGoogleMaps } from '../utils/googleMaps';
import { MapDrawingControls } from './MapDrawingControls';
import { type AreaShape, pointInShape } from '../utils/mapShape';

interface GoogleMapsPropertyMapProps {
  properties: Property[];
  neighborhood: string;
  className?: string;
  onPropertySelect?: (property: Property) => void;
  shape?: AreaShape | null;
  onShapeChange?: (shape: AreaShape | null) => void;
  onAreaPropertyUuidsChange?: (uuids: string[] | null) => void;
}

export function GoogleMapsPropertyMap({ 
  properties, 
  neighborhood, 
  className,
  onPropertySelect,
  shape: shapeProp,
  onShapeChange,
  onAreaPropertyUuidsChange,
}: GoogleMapsPropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<string | number, GeocodingResult>>(new Map());
  const [internalShape, setInternalShape] = useState<AreaShape | null>(null);
  const shape = shapeProp !== undefined ? shapeProp : internalShape;
  const setShape = (s: AreaShape | null) => {
    if (shapeProp === undefined) setInternalShape(s);
    onShapeChange?.(s);
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMaps();
        
        const [lat, lng] = getFallbackCoordinates(neighborhood);
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative'
        });

        setIsMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [neighborhood]);

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

  // Compute display position (geocoded or fallback) for each property.
  const positionsByUuid = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    properties.forEach((property) => {
      const geocoded = geocodedCoords.get(property.uuid);
      if (geocoded) {
        map.set(property.uuid, { lat: geocoded.lat, lng: geocoded.lng });
        return;
      }
      const [baseLat, baseLng] = getFallbackCoordinates(property.neighborhood);
      const seed = parseInt(property.uuid.replace(/\D/g, '').slice(-5)) || 0;
      const offsetLat = ((seed * 7) % 100 - 50) * 0.003;
      const offsetLng = ((seed * 13) % 100 - 50) * 0.003;
      map.set(property.uuid, { lat: baseLat + offsetLat, lng: baseLng + offsetLng });
    });
    return map;
  }, [properties, geocodedCoords]);

  // Compute uuids inside the active shape and notify the parent.
  const uuidsInShape = useMemo<string[] | null>(() => {
    if (!shape || !isMapReady) return null;
    const inside: string[] = [];
    properties.forEach((p) => {
      const pos = positionsByUuid.get(p.uuid);
      if (pos && pointInShape(shape, pos.lat, pos.lng)) inside.push(p.uuid);
    });
    return inside;
  }, [shape, properties, positionsByUuid, isMapReady]);

  useEffect(() => {
    onAreaPropertyUuidsChange?.(uuidsInShape);
  }, [uuidsInShape, onAreaPropertyUuidsChange]);

  // Add markers when map is ready and geocoding is done
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    const insideSet = uuidsInShape ? new Set(uuidsInShape) : null;
    let visibleCount = 0;

    // Add markers for each property
    properties.forEach(property => {
      const position = positionsByUuid.get(property.uuid)!;
      const isVisible = !insideSet || insideSet.has(property.uuid);
      if (isVisible) visibleCount++;

      // Create custom marker with price label
      const markerColor = property.operationType.toLowerCase() === 'venta' ? '#ef4444' : '#3b82f6';
      
      // Create custom marker with house icon and price
      const marker = new window.google.maps.Marker({
        position,
        map: isVisible ? mapInstanceRef.current : null,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
              <g>
                <!-- House icon background -->
                <circle cx="30" cy="25" r="20" fill="${markerColor}" stroke="white" stroke-width="2"/>
                <!-- House icon -->
                <path d="M20 30v-6h4v6h5v-8h3L30 13 28 22h3v8z" fill="white"/>
                <!-- Price badge -->
                <rect x="5" y="50" width="50" height="20" rx="10" fill="white" stroke="${markerColor}" stroke-width="2"/>
                <text x="30" y="63" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${markerColor}">
                  €${property.price >= 1000 ? Math.round(property.price/1000) + 'K' : property.price}
                </text>
              </g>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(60, 80),
          anchor: new window.google.maps.Point(30, 80)
        },
        title: `${property.title || property.address} - €${property.price.toLocaleString()}`
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
          <div style="position: relative; width: 100%; height: 180px; background: #f3f4f6;">
            <div id="carousel-${propertyId}" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
              ${images.map((img: string, idx: number) => `
                <img 
                  src="${img.startsWith('/property-images/') ? img : img}" 
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
                var btn = document.getElementById('fav-${propertyId}');
                var isFav = btn.dataset.fav === 'true';
                btn.dataset.fav = isFav ? 'false' : 'true';
                btn.innerHTML = isFav 
                  ? '<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path></svg>'
                  : '<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#ef4444\" stroke=\"#ef4444\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path></svg>';
                event.stopPropagation();
              })()"
              data-fav="false"
              style="position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.4); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s;"
              onmouseover="this.style.transform='scale(1.1)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            
            <!-- Operation Type Badge -->
            <span style="position: absolute; top: 10px; left: 10px; background: ${markerColor}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              ${property.operationType}
            </span>
          </div>
          
          <!-- Property Details -->
          <div style="padding: 14px;">
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
        // Close any open info windows
        markersRef.current.forEach(m => m.infoWindow?.close());
        
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedProperty(property);
        
        if (onPropertySelect) {
          onPropertySelect(property);
        }
      });

      // Store reference to info window for cleanup
      (marker as any).infoWindow = infoWindow;
      markersRef.current.push(marker);
      if (isVisible) bounds.extend(position);
    });

    // Fit map to show all (visible) markers — but don't auto-zoom while a shape is active,
    // so the user keeps the framing they picked when drawing.
    if (!shape && properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      if (visibleCount === 1) {
        mapInstanceRef.current.setZoom(Math.max(16, mapInstanceRef.current.getZoom()));
      }
    }

  }, [properties, isLoading, onPropertySelect, positionsByUuid, isMapReady, uuidsInShape, shape]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-sm">
              Ubicando propiedades en el mapa...
            </div>
          </div>
        </div>
      )}

      <div 
        ref={mapRef}
        className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-gray-100 rounded-lg border"
        data-testid="google-property-map"
      />

      {/* Drawing controls — top-left, above the map */}
      <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)]">
        <MapDrawingControls
          map={mapInstanceRef.current}
          isReady={isMapReady}
          shape={shape}
          onShapeChange={setShape}
          color="#0284c5"
        />
      </div>

      {/* Properties-in-area pill */}
      {shape && uuidsInShape !== null && (
        <div
          className="absolute top-3 right-3 z-10 bg-white/95 px-3 py-1.5 rounded-full shadow border border-gray-200 text-sm font-medium text-gray-800"
          data-testid="text-area-property-count"
        >
          {uuidsInShape.length} {uuidsInShape.length === 1 ? 'inmueble' : 'inmuebles'} en esta zona
        </div>
      )}

      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {selectedProperty.title || selectedProperty.address}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedProperty.address}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-blue-600">
                  €{selectedProperty.price.toLocaleString()}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {selectedProperty.operationType}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedProperty(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              data-testid="close-property-details"
            >
              ✕
            </button>
          </div>
          <button 
            onClick={() => window.location.href = `/inmueble/${selectedProperty.uuid}`}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition-colors mt-3"
            data-testid="view-property-details"
          >
            Ver detalles
          </button>
        </div>
      )}
    </div>
  );
}