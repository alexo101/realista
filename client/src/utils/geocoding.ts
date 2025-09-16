// Geocoding utilities for address to coordinates conversion using Google Maps API

export interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>();

// Google Maps Geocoding API - calls through backend to secure API key
export async function geocodeAddress(address: string, neighborhood?: string): Promise<GeocodingResult | null> {
  // Build full address, avoiding duplication of neighborhood/locality
  let fullAddress = address;
  
  if (neighborhood && !address.toLowerCase().includes(neighborhood.toLowerCase())) {
    fullAddress = `${address}, ${neighborhood}`;
  }
  
  if (!fullAddress.toLowerCase().includes('barcelona')) {
    fullAddress = `${fullAddress}, Barcelona`;
  }
  
  if (!fullAddress.toLowerCase().includes('spain')) {
    fullAddress = `${fullAddress}, Spain`;
  }
  
  // Check cache first
  if (geocodingCache.has(fullAddress)) {
    return geocodingCache.get(fullAddress)!;
  }

  try {
    // Make API call through our backend to avoid exposing the API key
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: fullAddress })
    });

    if (!response.ok) {
      console.warn(`Geocoding failed for address: ${fullAddress}, Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.lat && data.lng) {
      const result: GeocodingResult = {
        lat: data.lat,
        lng: data.lng,
        address: data.formatted_address || fullAddress
      };
      
      // Cache the result
      geocodingCache.set(fullAddress, result);
      return result;
    }

    console.warn(`No geocoding results found for: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Batch geocode multiple addresses
export async function geocodeAddresses(addresses: Array<{ address: string; neighborhood?: string; id: number }>): Promise<Map<number, GeocodingResult>> {
  const results = new Map<number, GeocodingResult>();
  
  // Process addresses sequentially to avoid rate limiting
  for (const item of addresses) {
    try {
      const result = await geocodeAddress(item.address, item.neighborhood);
      if (result) {
        results.set(item.id, result);
      }
    } catch (error) {
      console.warn(`Failed to geocode address: ${item.address}`, error);
    }
    
    // Add delay between requests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Fallback coordinates for Barcelona neighborhoods when geocoding fails
export const NEIGHBORHOOD_FALLBACK_COORDS: Record<string, [number, number]> = {
  'Eixample': [41.3874, 2.1686],
  'Gràcia': [41.4036, 2.1565],
  'Sarrià-Sant Gervasi': [41.4003, 2.1370],
  'Les Corts': [41.3838, 2.1298], 
  'Sants-Montjuïc': [41.3748, 2.1414],
  'Ciutat Vella': [41.3825, 2.1769],
  'Sant Andreu': [41.4348, 2.1890],
  'Horta-Guinardó': [41.4186, 2.1635],
  'Nou Barris': [41.4430, 2.1774],
  'Sant Martí': [41.4066, 2.2042],
  'El Raval': [41.3792, 2.1695],
  'Barrio Gótico': [41.3837, 2.1765],
  'La Barceloneta': [41.3826, 2.1900],
  'El Born': [41.3845, 2.1823],
  'Poble Sec': [41.3732, 2.1608],
  'Montjuïc': [41.3648, 2.1540],
  'Pedralbes': [41.3891, 2.1121],
  'Tibidabo': [41.4226, 2.1186],
  'Park Güell': [41.4145, 2.1527],
  'Sagrada Familia': [41.4036, 2.1744],
  'Passeig de Gràcia': [41.3932, 2.1649],
  'Las Ramblas': [41.3810, 2.1734],
  'Diagonal': [41.3969, 2.1601],
  'Poblenou': [41.4037, 2.2003],
  'Vila Olímpica': [41.3881, 2.1969],
  'Badalona': [41.4507, 2.2470],
  'L\'Hospitalet': [41.3598, 2.1074],
  'Cornellà de Llobregat': [41.3537, 2.0746],
  'Sant Boi de Llobregat': [41.3429, 2.0381],
  'Viladecans': [41.3144, 2.0141],
  'Gavà': [41.3065, 2.0009],
  'Castelldefels': [41.2817, 1.9756],
  'Sitges': [41.2368, 1.8058],
  'Vilanova i la Geltrú': [41.2237, 1.7256],
  'Barcelona': [41.3851, 2.1734]
};

// Get fallback coordinates for a neighborhood
export function getFallbackCoordinates(neighborhood: string): [number, number] {
  return NEIGHBORHOOD_FALLBACK_COORDS[neighborhood] || NEIGHBORHOOD_FALLBACK_COORDS['Barcelona'];
}