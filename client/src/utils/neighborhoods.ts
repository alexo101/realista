// Hierarchical city structure with districts and neighborhoods
export interface CityStructure {
  city: string;
  districts: DistrictStructure[];
}

export interface DistrictStructure {
  district: string;
  neighborhoods: string[];
}

// Barcelona structure
const BARCELONA_STRUCTURE: CityStructure = {
  city: 'Barcelona',
  districts: [
  {
    district: "Ciutat Vella",
    neighborhoods: ["El Raval", "El Gòtic", "La Barceloneta", "Sant Pere, Santa Caterina i la Ribera"]
  },
  {
    district: "Eixample",
    neighborhoods: ["El Fort Pienc", "La Sagrada Família", "La Dreta de l'Eixample", "L'Antiga Esquerra de l'Eixample", "La Nova Esquerra de l'Eixample", "Sant Antoni"]
  },
  {
    district: "Sants-Montjuïc",
    neighborhoods: ["El Poble-sec", "La Marina del Prat Vermell", "La Marina de Port", "La Font de la Guatlla", "Hostafrancs", "La Bordeta", "Sants-Badal", "Sants"]
  },
  {
    district: "Les Corts",
    neighborhoods: ["Les Corts", "La Maternitat i Sant Ramon", "Pedralbes"]
  },
  {
    district: "Sarrià-Sant Gervasi",
    neighborhoods: ["Vallvidrera, el Tibidabo i les Planes", "Sarrià", "Les Tres Torres", "Sant Gervasi - la Bonanova", "Sant Gervasi - Galvany", "El Putxet i el Farró"]
  },
  {
    district: "Gràcia",
    neighborhoods: ["Vallcarca i els Penitents", "El Coll", "La Salut", "Vila de Gràcia", "Camp d'en Grassot i Gràcia Nova"]
  },
  {
    district: "Horta-Guinardó",
    neighborhoods: ["El Baix Guinardó", "Can Baró", "El Guinardó", "La Font d'en Fargues", "El Carmel", "La Teixonera", "Sant Genís dels Agudells", "Montbau", "La Vall d'Hebron", "La Clota", "Horta"]
  },
  {
    district: "Nou Barris",
    neighborhoods: ["Vilapicina i la Torre Llobeta", "Porta", "El Turó de la Peira", "Can Peguera", "La Guineueta", "Canyelles", "Les Roquetes", "Verdun", "La Prosperitat", "La Trinitat Nova", "Torre Baró", "Ciutat Meridiana", "Vallbona"]
  },
  {
    district: "Sant Andreu",
    neighborhoods: ["La Trinitat Vella", "Baró de Viver", "El Bon Pastor", "Sant Andreu del Palomar", "La Sagrera", "El Congrés i els Indians", "Navas"]
  },
  {
    district: "Sant Martí",
    neighborhoods: ["El Clot", "El Camp de l'Arpa del Clot", "La Verneda i la Pau", "Sant Martí de Provençals", "El Besòs i el Maresme", "Provençals del Poblenou", "Diagonal Mar i el Front Marítim del Poblenou", "El Poblenou", "El Parc i la Llacuna del Poblenou", "La Vila Olímpica del Poblenou"]
  }
  ]
};

// Madrid structure
const MADRID_STRUCTURE: CityStructure = {
  city: 'Madrid',
  districts: [
    {
      district: "Centro",
      neighborhoods: ["Palacio", "Embajadores", "Cortes", "Justicia", "Universidad", "Sol"]
    },
    {
      district: "Arganzuela",
      neighborhoods: ["Imperial", "Acacias", "Chopera", "Legazpi", "Delicias", "Palos de la Frontera", "Atocha"]
    },
    {
      district: "Retiro",
      neighborhoods: ["Pacífico", "Adelfas", "Estrella", "Ibiza", "Jerónimos", "Niño Jesús"]
    },
    {
      district: "Salamanca",
      neighborhoods: ["Recoletos", "Goya", "Fuente del Berro", "Guindalera", "Lista", "Castellana"]
    },
    {
      district: "Chamartín",
      neighborhoods: ["El Viso", "Prosperidad", "Ciudad Jardín", "Hispanoamérica", "Nueva España", "Castilla"]
    },
    {
      district: "Tetuán",
      neighborhoods: ["Bellas Vistas", "Cuatro Caminos", "Castillejos", "Almenara", "Valdeacederas", "Berruguete"]
    },
    {
      district: "Chamberí",
      neighborhoods: ["Gaztambide", "Arapiles", "Trafalgar", "Almagro", "Ríos Rosas", "Vallehermoso"]
    },
    {
      district: "Fuencarral-El Pardo",
      neighborhoods: ["El Pardo", "Fuentelarreina", "Peñagrande", "Pilar", "La Paz", "Valverde", "Mirasierra", "El Goloso"]
    },
    {
      district: "Moncloa-Aravaca",
      neighborhoods: ["Casa de Campo", "Argüelles", "Ciudad Universitaria", "Valdezarza", "Valdemarín", "El Plantío", "Aravaca"]
    },
    {
      district: "Latina",
      neighborhoods: ["Los Cármenes", "Puerta del Ángel", "Lucero", "Aluche", "Campamento", "Cuatro Vientos", "Las Águilas"]
    },
    {
      district: "Carabanchel",
      neighborhoods: ["Comillas", "Opañel", "San Isidro", "Puerta Bonita", "Buenavista", "Abrantes"]
    },
    {
      district: "Usera",
      neighborhoods: ["Orcasitas", "Orcasur", "San Fermín", "Almendrales", "Moscardó", "Zofío", "Pradolongo"]
    },
    {
      district: "Puente de Vallecas",
      neighborhoods: ["Entrevías", "San Diego", "Palomeras Bajas", "Palomeras Sureste", "Portazgo", "Numancia"]
    },
    {
      district: "Moratalaz",
      neighborhoods: ["Pavones", "Horcajo", "Marroquina", "Media Legua", "Fontarrón", "Vinateros"]
    },
    {
      district: "Ciudad Lineal",
      neighborhoods: ["Ventas", "Pueblo Nuevo", "Quintana", "Concepción", "San Pascual", "San Juan Bautista", "Colina", "Atalaya", "Costillares"]
    },
    {
      district: "Hortaleza",
      neighborhoods: ["Palomas", "Piovera", "Canillas", "Pinar del Rey", "Apóstol Santiago", "Valdefuentes"]
    },
    {
      district: "Villaverde",
      neighborhoods: ["Villaverde Alto", "San Cristóbal", "Butarque", "Los Rosales", "Los Ángeles"]
    },
    {
      district: "Villa de Vallecas",
      neighborhoods: ["Casco histórico de Vallecas", "Santa Eugenia", "Ensanche de Vallecas"]
    },
    {
      district: "Vicálvaro",
      neighborhoods: ["Casco histórico de Vicálvaro", "Valdebernardo", "Valderrivas", "El Cañaveral"]
    },
    {
      district: "San Blas-Canillejas",
      neighborhoods: ["Simancas", "Hellín", "Amposta", "Arcos", "Rosas", "Rejas", "Canillejas", "Salvador"]
    },
    {
      district: "Barajas",
      neighborhoods: ["Alameda de Osuna", "Aeropuerto", "Casco histórico de Barajas", "Timón", "Corralejos"]
    }
  ]
};

// All cities
export const ALL_CITIES: CityStructure[] = [BARCELONA_STRUCTURE, MADRID_STRUCTURE];

// Spanish Provinces
export const PROVINCES: string[] = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Balears, (Illes)",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ceuta",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Gipuzkoa",
  "Huelva",
  "Huesca",
  "Jaén",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Melilla",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Las Palmas",
  "Pontevedra",
  "La Rioja",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza"
];

// Province to Cities mapping (cities that have full neighborhood data)
// Barcelona city belongs to Barcelona province, Madrid city belongs to Madrid province
export const PROVINCE_CITIES: Record<string, string[]> = {
  "Barcelona": ["Barcelona"],
  "Madrid": ["Madrid"],
  // Other provinces can be added here as more cities are supported
};

// Get all provinces
export function getProvinces(): string[] {
  return PROVINCES;
}

// Check if a name is a province
export function isProvince(name: string): boolean {
  return PROVINCES.includes(name);
}

// Get the province for a given city
export function getProvinceByCity(city: string): string | null {
  for (const [province, cities] of Object.entries(PROVINCE_CITIES)) {
    if (cities.includes(city)) {
      return province;
    }
  }
  return null;
}

// Get all cities in a province
export function getCitiesByProvince(province: string): string[] {
  return PROVINCE_CITIES[province] || [];
}

// Legacy Barcelona exports for backward compatibility
export const BARCELONA_DISTRICTS_AND_NEIGHBORHOODS = BARCELONA_STRUCTURE.districts;

// Lista plana de todos los barrios para manipulación fácil
export const BARCELONA_NEIGHBORHOODS = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.flatMap(district => district.neighborhoods);

// Lista de distritos
export const BARCELONA_DISTRICTS = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map(district => district.district);

// Comprobar si un elemento es un distrito
export function isDistrict(name: string, city: string = 'Barcelona'): boolean {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  if (!cityStructure) return false;
  return cityStructure.districts.some(d => d.district === name);
}

// Función para encontrar el distrito de un barrio
export function findDistrictByNeighborhood(neighborhood: string, city: string = 'Barcelona'): string | null {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  if (!cityStructure) return null;
  // Si es el texto 'Barcelona (Todos los barrios)', devolvemos 'Barcelona'
  if (neighborhood.match(/Barcelona\s*\(Todos los barrios\)/i)) {
    return 'Barcelona';
  }
  
  // Si el neighborhood es un distrito, devolvemos el mismo
  if (isDistrict(neighborhood, city)) {
    return neighborhood;
  }
  
  // Caso normal: buscar a qué distrito pertenece el barrio
  for (const district of cityStructure.districts) {
    if (district.neighborhoods.includes(neighborhood)) {
      return district.district;
    }
  }
  return null;
}

// Función para obtener todos los barrios que pertenecen a un distrito
// If district has no neighborhoods (terminal district), returns the district name itself
export function getNeighborhoodsByDistrict(districtName: string, city: string = 'Barcelona'): string[] {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  if (!cityStructure) return [];
  const district = cityStructure.districts.find(d => d.district === districtName);
  if (!district) return [];
  // If district has no neighborhoods, it's a terminal level - return district name for filtering
  if (district.neighborhoods.length === 0) {
    return [districtName];
  }
  return district.neighborhoods;
}

// Check if a district is terminal (has no child neighborhoods)
export function isDistrictTerminal(districtName: string, city: string = 'Barcelona'): boolean {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  if (!cityStructure) return false;
  const district = cityStructure.districts.find(d => d.district === districtName);
  return district ? district.neighborhoods.length === 0 : false;
}

// Función para verificar si una consulta se refiere a toda la ciudad
export function isCityWideSearch(queryNeighborhood: string, city: string = 'Barcelona'): boolean {
  return queryNeighborhood === city || 
         queryNeighborhood.match(new RegExp(`${city}\\s*\\(Todos los barrios\\)`, 'i')) !== null;
}

// Función para expandir la búsqueda basada en la jerarquía
// Now supports: Province > City > District > Neighborhood
export function expandNeighborhoodSearch(queryNeighborhood: string, city: string = 'Barcelona'): string[] {
  // CRITICAL FIX: Parse hierarchical labels like "Gràcia, Barcelona" or "Vila de Gràcia, Gràcia, Barcelona"
  // The frontend sends these hierarchical formats but we need to extract the actual location name
  let actualQuery = queryNeighborhood;
  let effectiveCity = city; // Use local variable to avoid mutating the parameter
  
  // Check for explicit province suffix "(provincia)" - e.g., "Barcelona (provincia)"
  const provinceMatch = queryNeighborhood.match(/^(.+?)\s*\(provincia\)$/i);
  if (provinceMatch) {
    const provinceName = provinceMatch[1].trim();
    if (isProvince(provinceName)) {
      // Expand to all neighborhoods in all cities of this province
      const citiesInProvince = getCitiesByProvince(provinceName);
      const allNeighborhoods: string[] = [];
      
      for (const cityName of citiesInProvince) {
        const cityStructure = ALL_CITIES.find(c => c.city === cityName);
        if (cityStructure) {
          allNeighborhoods.push(...cityStructure.districts.flatMap(d => d.neighborhoods));
        }
      }
      
      return allNeighborhoods;
    }
  }
  
  const parsed = parseNeighborhoodDisplayName(queryNeighborhood);
  
  if (parsed) {
    // If it's a full 3-part format (Neighborhood, District, City)
    actualQuery = parsed.neighborhood;
    effectiveCity = parsed.city;
  } else {
    // Check if it's a 2-part format like "District, City" or "City, Province"
    const parts = queryNeighborhood.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const [first, second] = parts;
      // Check if second part is a province (for "City, Province" format)
      if (isProvince(second)) {
        // This is a city within a province, search that city
        actualQuery = first;
        effectiveCity = first;
      } else {
        // First part is district or neighborhood, second part is city
        actualQuery = first;
        effectiveCity = second;
      }
    }
  }
  
  // Check if the query is a province (but not a city with same name)
  // This handles provinces that don't share names with cities
  const cities = getCities();
  if (isProvince(actualQuery) && !cities.includes(actualQuery)) {
    const citiesInProvince = getCitiesByProvince(actualQuery);
    const allNeighborhoods: string[] = [];
    
    for (const cityName of citiesInProvince) {
      const cityStructure = ALL_CITIES.find(c => c.city === cityName);
      if (cityStructure) {
        allNeighborhoods.push(...cityStructure.districts.flatMap(d => d.neighborhoods));
      }
    }
    
    return allNeighborhoods;
  }
  
  const cityStructure = ALL_CITIES.find(c => c.city === effectiveCity);
  if (!cityStructure) return [];
  
  const allNeighborhoods = cityStructure.districts.flatMap(d => d.neighborhoods);
  
  // Si es búsqueda a nivel de ciudad, devolver todos los barrios
  if (isCityWideSearch(actualQuery, effectiveCity)) {
    return allNeighborhoods;
  }
  
  // Si es un distrito, devolver todos los barrios de ese distrito
  if (isDistrict(actualQuery, effectiveCity)) {
    return getNeighborhoodsByDistrict(actualQuery, effectiveCity);
  }
  
  // Si es un barrio específico, solo devolvemos ese barrio
  if (allNeighborhoods.includes(actualQuery)) {
    return [actualQuery];
  }
  
  // Si no coincide con ninguno, devolvemos array vacío
  return [];
}

// New hierarchical utility functions
export function getCities(): string[] {
  return ALL_CITIES.map(city => city.city);
}

export function getDistrictsByCity(city: string): string[] {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  return cityStructure ? cityStructure.districts.map(d => d.district) : [];
}

export function getAllNeighborhoodsByCity(city: string): string[] {
  const cityStructure = ALL_CITIES.find(c => c.city === city);
  return cityStructure ? cityStructure.districts.flatMap(d => d.neighborhoods) : [];
}

export function getNeighborhoodDisplayName(neighborhood: string, district: string, city: string): string {
  return `${neighborhood}, ${district}, ${city}`;
}

export function parseNeighborhoodDisplayName(displayName: string): { neighborhood: string; district: string; city: string } | null {
  const parts = displayName.split(', ').map(p => p.trim());
  if (parts.length === 3) {
    return {
      neighborhood: parts[0],
      district: parts[1], 
      city: parts[2]
    };
  }
  return null;
}

// Search function for hierarchical autocomplete
export function searchNeighborhoods(query: string, cityFilter?: string): Array<{ neighborhood: string; district: string; city: string }> {
  const results: Array<{ neighborhood: string; district: string; city: string }> = [];
  const lowerQuery = query.toLowerCase();
  
  const citiesToSearch = cityFilter ? [cityFilter] : getCities();
  
  for (const city of citiesToSearch) {
    const cityStructure = ALL_CITIES.find(c => c.city === city);
    if (!cityStructure) continue;
    
    for (const districtData of cityStructure.districts) {
      for (const neighborhood of districtData.neighborhoods) {
        if (neighborhood.toLowerCase().includes(lowerQuery) || 
            districtData.district.toLowerCase().includes(lowerQuery) ||
            city.toLowerCase().includes(lowerQuery)) {
          results.push({
            neighborhood,
            district: districtData.district,
            city
          });
        }
      }
    }
  }
  
  return results;
}