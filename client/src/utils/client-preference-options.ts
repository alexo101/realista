export type PreferenceOption = {
  value: string;
  labelKey: string;
};

export const PREFERENCE_OPERATION_OPTIONS: PreferenceOption[] = [
  { value: "Venta", labelKey: "manage.client_pref_option.operation.venta" },
  { value: "Alquiler", labelKey: "manage.client_pref_option.operation.alquiler" },
];

export const PREFERENCE_PROPERTY_TYPE_OPTIONS: PreferenceOption[] = [
  { value: "Vivienda", labelKey: "manage.client_pref_option.property_type.vivienda" },
  { value: "Oficinas", labelKey: "manage.client_pref_option.property_type.oficinas" },
  { value: "Locales", labelKey: "manage.client_pref_option.property_type.locales" },
  { value: "Parking", labelKey: "manage.client_pref_option.property_type.parking" },
  { value: "Terrenos", labelKey: "manage.client_pref_option.property_type.terrenos" },
  { value: "Trasteros", labelKey: "manage.client_pref_option.property_type.trasteros" },
  { value: "Edificios", labelKey: "manage.client_pref_option.property_type.edificios" },
];

export const PREFERENCE_HOUSING_TYPE_OPTIONS: PreferenceOption[] = [
  { value: "Pisos", labelKey: "manage.client_pref_option.housing_type.pisos" },
  { value: "Áticos", labelKey: "manage.client_pref_option.housing_type.aticos" },
  { value: "Casas", labelKey: "manage.client_pref_option.housing_type.casas" },
  { value: "Chalets", labelKey: "manage.client_pref_option.housing_type.chalets" },
  { value: "Dúplex", labelKey: "manage.client_pref_option.housing_type.duplex" },
  { value: "Estudios", labelKey: "manage.client_pref_option.housing_type.estudios" },
];

export const PREFERENCE_FLOOR_OPTIONS: PreferenceOption[] = [
  { value: "Bajo", labelKey: "manage.client_pref_option.floor.bajo" },
  { value: "Planta intermedia", labelKey: "manage.client_pref_option.floor.planta_intermedia" },
  { value: "Última planta", labelKey: "manage.client_pref_option.floor.ultima_planta" },
  { value: "Ático", labelKey: "manage.client_pref_option.floor.atico" },
];

export const PREFERENCE_CONDITION_OPTIONS: PreferenceOption[] = [
  { value: "Obra nueva", labelKey: "manage.client_pref_option.condition.obra_nueva" },
  { value: "Buen estado", labelKey: "manage.client_pref_option.condition.buen_estado" },
  { value: "A reformar", labelKey: "manage.client_pref_option.condition.a_reformar" },
  { value: "Reformado", labelKey: "manage.client_pref_option.condition.reformado" },
];

export const PREFERENCE_AVAILABILITY_OPTIONS: PreferenceOption[] = [
  { value: "Inmediatamente", labelKey: "manage.client_pref_option.availability.inmediatamente" },
  { value: "A partir de", labelKey: "manage.client_pref_option.availability.a_partir_de" },
];
