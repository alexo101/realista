// Unified property features configuration
// This ensures consistency between property form and property filters

export const PROPERTY_FEATURES = [
  // Comodidades básicas
  { id: "aire-acondicionado", label: "Aire acondicionado" },
  { id: "calefaccion", label: "Calefacción" },
  { id: "ascensor", label: "Ascensor" },
  
  // Espacios exteriores
  { id: "terraza", label: "Terraza" },
  { id: "balcon", label: "Balcón" },
  { id: "jardin", label: "Jardín" },
  { id: "piscina", label: "Piscina" },
  
  // Almacenamiento y organización
  { id: "armarios-empotrados", label: "Armarios empotrados" },
  { id: "trastero", label: "Trastero" },
  
  // Parking y transporte
  { id: "garaje", label: "Garaje" },
  { id: "parking", label: "Parking" },
  { id: "bien-conectado", label: "Bien conectado" },
  
  // Características de la vivienda
  { id: "exterior", label: "Exterior" },
  { id: "amueblado", label: "Amueblado" },
  { id: "electrodomesticos", label: "Electrodomésticos" },
  { id: "bano-suite", label: "Baño en-suite" },
  
  // Accesibilidad y mascotas
  { id: "accesible", label: "Accesible" },
  { id: "permite-mascota", label: "Permite mascota" },
  
  // Vistas y ubicación
  { id: "vistas-mar", label: "Vistas al mar" },
  
  // Seguridad y servicios adicionales
  { id: "security", label: "Seguridad 24h" },
  { id: "gym", label: "Gimnasio" },
  { id: "fireplace", label: "Chimenea" }
] as const;

// Export feature IDs as a type for TypeScript
export type PropertyFeatureId = typeof PROPERTY_FEATURES[number]['id'];