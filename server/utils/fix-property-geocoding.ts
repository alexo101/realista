import { storage } from "../storage";

interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

async function geocodeAddress(address: string, neighborhood?: string): Promise<GeocodingResult | null> {
  const fullAddress = neighborhood ? `${address}, ${neighborhood}, Barcelona, Spain` : `${address}, Barcelona, Spain`;
  
  try {
    const encodedAddress = encodeURIComponent(fullAddress);
    // Use more specific Barcelona bounding box and better query parameters
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1&bounded=1&viewbox=2.0523,41.4695,2.2280,41.3200&countrycodes=es`,
      {
        headers: {
          'User-Agent': 'PropertySearchApp/1.0'
        }
      }
    );

    if (!response.ok) {
      console.warn(`Geocoding failed for address: ${fullAddress}, Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result: GeocodingResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: fullAddress
      };
      
      return result;
    }

    console.warn(`No geocoding results found for: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Clean address by removing invalid components like "3-2", "4-1", "8-2" (escalera-puerta format)
function cleanAddress(address: string): string {
  // Remove patterns like "3-2", "4-1", "8-2" from addresses that were created with the old format
  const cleaned = address.replace(/\s+\d+-\d+$/, '').trim();
  return cleaned;
}

export async function fixPropertyGeocodingData() {
  console.log('Starting property geocoding fix...');
  
  try {
    const properties = await storage.getProperties();
    console.log(`Found ${properties.length} properties to check`);
    
    for (const property of properties) {
      try {
        // Clean the address first
        const cleanedAddress = cleanAddress(property.address);
        
        if (cleanedAddress !== property.address) {
          console.log(`Cleaning address for property ${property.id}: "${property.address}" -> "${cleanedAddress}"`);
        }
        
        // Try to geocode the cleaned address
        const geocodeResult = await geocodeAddress(cleanedAddress, property.neighborhood);
        
        if (geocodeResult) {
          console.log(`Successfully geocoded property ${property.id} (${property.reference}): ${geocodeResult.lat}, ${geocodeResult.lng}`);
          
          // Update the property with clean address and geocoding data if needed
          await storage.updatePropertyAddress(property.id, cleanedAddress, geocodeResult.lat, geocodeResult.lng);
        } else {
          console.warn(`Failed to geocode property ${property.id} (${property.reference}): ${cleanedAddress}, ${property.neighborhood}`);
        }
        
        // Add delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
      }
    }
    
    console.log('Property geocoding fix completed');
    
  } catch (error) {
    console.error('Error fixing property geocoding:', error);
    throw error;
  }
}