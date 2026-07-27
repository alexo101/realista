type AgentAddressFields = {
  address?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  escalera?: string | null;
  planta?: string | null;
  puerta?: string | null;
};

/** Strip trailing city/country from a Google-style formatted address. */
function stripCityCountry(address: string): string {
  return address
    .replace(/,\s*[^,]+,\s*(Spain|España)\s*$/i, "")
    .replace(/,\s*(Spain|España)\s*$/i, "")
    .trim();
}

function formatStreetLine(property: AgentAddressFields): string {
  const streetName = property.streetName?.trim();
  const streetNumber = property.streetNumber?.trim();

  if (streetName) {
    return streetNumber ? `${streetName} ${streetNumber}` : streetName;
  }

  if (property.address?.trim()) {
    return stripCityCountry(property.address.trim());
  }

  return "";
}

function formatUnitSuffix(property: AgentAddressFields): string {
  const parts: string[] = [];
  const escalera = property.escalera?.trim();
  const planta = property.planta?.trim();
  const puerta = property.puerta?.trim();

  if (escalera) {
    parts.push(`Esc-${escalera}`);
  }

  if (planta || puerta) {
    if (planta && puerta) {
      parts.push(`${planta} - ${puerta}`);
    } else if (planta) {
      parts.push(planta);
    } else if (puerta) {
      parts.push(puerta);
    }
  }

  return parts.join(", ");
}

/** Agent-facing address: street without city/country, plus Escalera/Planta/Puerta. */
export function formatAgentPropertyAddress(property: AgentAddressFields): string {
  const street = formatStreetLine(property);
  const unit = formatUnitSuffix(property);

  if (street && unit) {
    return `${street}, ${unit}`;
  }
  return street || unit || "";
}
