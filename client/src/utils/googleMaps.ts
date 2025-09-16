// Google Maps utilities and script loader

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
const callbacks: (() => void)[] = [];

export async function loadGoogleMaps(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // If already loaded, resolve immediately
    if (isGoogleMapsLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Add callback to the queue
    callbacks.push(resolve);

    // If already loading, don't load again
    if (isGoogleMapsLoading) {
      return;
    }

    isGoogleMapsLoading = true;

    try {
      // Get API key from backend
      const response = await fetch('/api/maps-config');
      const config = await response.json();
      
      if (!config.apiKey) {
        reject(new Error('Google Maps API key not available'));
        return;
      }

      // Create the callback function
      window.initGoogleMaps = () => {
        isGoogleMapsLoaded = true;
        isGoogleMapsLoading = false;
        
        // Execute all pending callbacks
        callbacks.forEach(callback => callback());
        callbacks.length = 0;
      };

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        isGoogleMapsLoading = false;
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    } catch (error) {
      isGoogleMapsLoading = false;
      reject(error);
    }
  });
}

export function createCustomMarker(
  position: { lat: number; lng: number },
  content: string,
  map: any
): any {
  const marker = new window.google.maps.Marker({
    position,
    map,
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 8.954 20 20 20s20-8.954 20-20C40 8.954 31.046 0 20 0z" fill="#3b82f6"/>
            <path d="M20 40l-5-10h10l-5 10z" fill="#3b82f6"/>
            <path d="M10 20v-6h4v6h5v-8h3L20 3 18 12h3v8z" fill="white"/>
          </g>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(40, 50),
      anchor: new window.google.maps.Point(20, 50)
    }
  });

  const infoWindow = new window.google.maps.InfoWindow({
    content
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return { marker, infoWindow };
}