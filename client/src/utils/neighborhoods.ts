// Estructura de distritos y barrios de Barcelona
export const BARCELONA_DISTRICTS_AND_NEIGHBORHOODS = [
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
];

// Función para encontrar el distrito de un barrio
export function findDistrictByNeighborhood(neighborhood: string): string | null {
  // Si es el texto 'Barcelona (Todos los barrios)', devolvemos 'Barcelona'
  if (neighborhood.match(/Barcelona\s*\(Todos los barrios\)/i)) {
    return 'Barcelona';
  }
  
  // Si el neighborhood es un distrito, devolvemos el mismo
  if (isDistrict(neighborhood)) {
    return neighborhood;
  }
  
  // Caso normal: buscar a qué distrito pertenece el barrio
  for (const district of BARCELONA_DISTRICTS_AND_NEIGHBORHOODS) {
    if (district.neighborhoods.includes(neighborhood)) {
      return district.district;
    }
  }
  return null;
}

// Lista plana de todos los barrios para manipulación fácil
export const BARCELONA_NEIGHBORHOODS = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.flatMap(district => district.neighborhoods);

// Lista de distritos
export const BARCELONA_DISTRICTS = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map(district => district.district);

// Comprobar si un elemento es un distrito
export function isDistrict(name: string): boolean {
  return BARCELONA_DISTRICTS.includes(name);
}