/**
 * Utility functions for generating SEO-friendly URL slugs
 * Handles Spanish characters and ensures uniqueness
 */

/**
 * Converts text to a URL-safe slug
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate slug for an agency based on its name
 */
export function generateAgencySlug(agencyName: string): string {
  return generateSlug(agencyName);
}

/**
 * Generate slug for an agent based on name and surname
 */
export function generateAgentSlug(name: string, surname: string, id?: number): string {
  const baseSlug = generateSlug(`${name} ${surname}`);
  // Add ID suffix if provided to ensure uniqueness (e.g., "juan-perez-5")
  return id ? `${baseSlug}-${id}` : baseSlug;
}

/**
 * Generate slug for a property based on title, neighborhood, and reference
 * Format: "title-neighborhood-reference" (e.g., "piso-gracia-abc-123")
 */
export function generatePropertySlug(
  title: string,
  neighborhood: string,
  reference?: string,
  id?: number
): string {
  const parts = [title, neighborhood];
  if (reference) {
    parts.push(reference);
  }
  const baseSlug = generateSlug(parts.join(' '));
  // Add ID suffix if no reference provided to ensure uniqueness
  return reference ? baseSlug : `${baseSlug}-${id}`;
}

/**
 * Check if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Extract ID from slug if it ends with numeric ID (e.g., "juan-perez-5" returns 5)
 */
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
