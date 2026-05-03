import { useEffect, useRef, useState } from 'react';
import { geocodeAddress, getFallbackCoordinates } from '../utils/geocoding';
import { loadGoogleMaps } from '../utils/googleMaps';

interface AgencyForMap {
  id: number;
  uuid?: string;
  slug?: string;
  agencyName: string;
  agencyAddress?: string | null;
  agencyLogo?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reviewCount?: number;
  reviewAverage?: number;
  rating?: number;
}

interface GoogleMapsAgenciesMapProps {
  agencies: AgencyForMap[];
  neighborhood: string;
  zoom?: number;
}

const AGENCY_PIN_COLOR = '#0f766e'; // teal-700, distinct from property red/blue

export default function GoogleMapsAgenciesMap({ agencies, neighborhood, zoom = 14 }: GoogleMapsAgenciesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const openInfoWindowRef = useRef<any>(null);
  const mapClickListenerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedCoords, setResolvedCoords] = useState<Map<number, { lat: number; lng: number }>>(new Map());

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      try {
        await loadGoogleMaps();
        const [lat, lng] = getFallbackCoordinates(neighborhood);
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });
        setIsMapReady(true);
      } catch (err) {
        console.error('Failed to initialize Google Maps for agencies:', err);
        setIsLoading(false);
      }
    };
    initMap();
  }, [neighborhood, zoom]);

  // Resolve coordinates for agencies that don't have lat/lng stored.
  useEffect(() => {
    if (agencies.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      setIsLoading(true);
      const next = new Map<number, { lat: number; lng: number }>();
      for (const agency of agencies) {
        if (typeof agency.latitude === 'number' && typeof agency.longitude === 'number') continue;
        if (!agency.agencyAddress || agency.agencyAddress.trim() === '') continue;
        try {
          const result = await geocodeAddress(agency.agencyAddress, agency.city || undefined);
          if (result) {
            next.set(agency.id, { lat: result.lat, lng: result.lng });
          }
        } catch (err) {
          console.warn(`Failed to geocode agency ${agency.id}:`, err);
        }
      }
      if (!cancelled) {
        setResolvedCoords(next);
        setIsLoading(false);
      }
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [agencies]);

  // Render markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (openInfoWindowRef.current) {
      openInfoWindowRef.current.close();
      openInfoWindowRef.current = null;
    }

    if (mapClickListenerRef.current) {
      window.google.maps.event.removeListener(mapClickListenerRef.current);
    }
    mapClickListenerRef.current = mapInstanceRef.current.addListener('click', () => {
      if (openInfoWindowRef.current) {
        openInfoWindowRef.current.close();
        openInfoWindowRef.current = null;
      }
    });

    const bounds = new window.google.maps.LatLngBounds();
    let plotted = 0;

    // Building-shaped pin SVG
    const pinSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <defs>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#ds)">
    <path d="M18 2 C9 2 3 8 3 17 c0 10 12 21 15 25 3-4 15-15 15-25 0-9-6-15-15-15z" fill="${AGENCY_PIN_COLOR}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
    <rect x="11" y="10" width="14" height="13" rx="1" fill="#ffffff"/>
    <rect x="13" y="12" width="3" height="3" fill="${AGENCY_PIN_COLOR}"/>
    <rect x="20" y="12" width="3" height="3" fill="${AGENCY_PIN_COLOR}"/>
    <rect x="13" y="17" width="3" height="3" fill="${AGENCY_PIN_COLOR}"/>
    <rect x="20" y="17" width="3" height="3" fill="${AGENCY_PIN_COLOR}"/>
    <rect x="16" y="20" width="4" height="3" fill="${AGENCY_PIN_COLOR}"/>
  </g>
</svg>`;

    const markerIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
      scaledSize: new window.google.maps.Size(36, 44),
      anchor: new window.google.maps.Point(18, 44),
    };

    agencies.forEach((agency) => {
      let position: { lat: number; lng: number } | null = null;
      if (typeof agency.latitude === 'number' && typeof agency.longitude === 'number') {
        position = { lat: agency.latitude, lng: agency.longitude };
      } else {
        const resolved = resolvedCoords.get(agency.id);
        if (resolved) position = resolved;
      }
      if (!position) return; // Skip agencies we couldn't place

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: agency.agencyName,
      });

      const rating = agency.reviewAverage ?? agency.rating ?? 0;
      const reviewCount = agency.reviewCount ?? 0;
      const profileUrl = `/agencias/${agency.slug || agency.id}`;

      const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const logoBlock = agency.agencyLogo
        ? `<img src="${escape(agency.agencyLogo)}" alt="${escape(agency.agencyName)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='<svg width=\\'32\\' height=\\'32\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'${AGENCY_PIN_COLOR}\\' stroke-width=\\'2\\'><path d=\\'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01\\'/></svg>'" />`
        : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${AGENCY_PIN_COLOR}" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>`;

      const ratingBlock = reviewCount > 0
        ? `<div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: #374151;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style="font-weight: 600;">${rating > 0 ? rating.toFixed(1) : 'Sin valoración'}</span>
            <span style="color: #6b7280;">(${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'})</span>
          </div>`
        : `<div style="margin-top: 4px; font-size: 13px; color: #6b7280;">Sin valoraciones</div>`;

      const content = `
        <div style="width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 56px; height: 56px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; border: 1px solid #e5e7eb;">
              ${logoBlock}
            </div>
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #1f2937; line-height: 1.3; word-wrap: break-word;">${escape(agency.agencyName)}</h3>
              ${ratingBlock}
            </div>
          </div>
          <button
            onclick="window.location.href='${profileUrl}'"
            style="width: 100%; margin-top: 12px; background: ${AGENCY_PIN_COLOR}; color: white; border: none; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 600; cursor: pointer;"
            onmouseover="this.style.opacity='0.9'"
            onmouseout="this.style.opacity='1'"
          >
            Ver perfil
          </button>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({ content });

      infoWindow.addListener('closeclick', () => {
        if (openInfoWindowRef.current === infoWindow) {
          openInfoWindowRef.current = null;
        }
      });

      marker.addListener('click', () => {
        if (openInfoWindowRef.current && openInfoWindowRef.current !== infoWindow) {
          openInfoWindowRef.current.close();
        }
        infoWindow.open(mapInstanceRef.current, marker);
        openInfoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      plotted++;
    });

    if (plotted > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      // Cap zoom for single-marker case
      if (plotted === 1) {
        const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
          if (mapInstanceRef.current.getZoom() > 16) mapInstanceRef.current.setZoom(16);
        });
        // listener auto-removed via Once
        void listener;
      }
    }
  }, [isMapReady, agencies, resolvedCoords]);

  return (
    <div className="relative w-full" data-testid="map-agencies">
      <div ref={mapRef} className="w-full h-[calc(100vh-180px)] min-h-[500px] rounded-lg overflow-hidden border border-gray-200" />
      {isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1.5 rounded-full shadow text-sm text-gray-700 flex items-center gap-2">
          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
          Cargando ubicaciones…
        </div>
      )}
      {!isLoading && agencies.length > 0 && markersRef.current.length === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 px-3 py-1.5 rounded-full shadow text-sm text-gray-700">
          Ninguna agencia tiene una ubicación geocodificable.
        </div>
      )}
    </div>
  );
}
