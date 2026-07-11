export const CLIENT_STATUS_VALUES = [
  "Nuevo",
  "Seguimiento",
  "En visitas",
  "Cerrando",
  "Ganado",
  "Perdido",
] as const;

export type ClientStatusValue = (typeof CLIENT_STATUS_VALUES)[number];

const STATUS_LABEL_KEYS: Record<ClientStatusValue, string> = {
  Nuevo: "manage.client_status.new",
  Seguimiento: "manage.client_status.follow_up",
  "En visitas": "manage.client_status.visiting",
  Cerrando: "manage.client_status.closing",
  Ganado: "manage.client_status.won",
  Perdido: "manage.client_status.lost",
};

const STATUS_COLORS: Record<ClientStatusValue, string> = {
  Nuevo: "bg-blue-100 text-blue-900",
  Seguimiento: "bg-blue-300 text-blue-900",
  "En visitas": "bg-blue-500 text-white",
  Cerrando: "bg-blue-700 text-white",
  Ganado: "bg-blue-900 text-white",
  Perdido: "bg-gray-500 text-white",
};

export function getClientStatuses(t: (key: string) => string) {
  return CLIENT_STATUS_VALUES.map((value) => ({
    value,
    label: t(STATUS_LABEL_KEYS[value]),
    color: STATUS_COLORS[value],
  }));
}
