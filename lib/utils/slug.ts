// lib/utils/slug.ts
// Generate URL-safe slugs from venue names
// Slugs are auto-generated on insert — never manually set by users
// Once set, a slug should never change (it's part of the URL)

/**
 * Convert a venue name to a URL-safe slug
 * Examples:
 *   "Terra Kulture VI" → "terra-kulture-vi"
 *   "Nok by Alara (Lagos)" → "nok-by-alara-lagos"
 *   "Hard Rock Café & Lounge" → "hard-rock-cafe-lounge"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')                          // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')           // Remove accent marks (é → e)
    .replace(/&/g, 'and')                      // Ampersand to "and"
    .replace(/[^a-z0-9\s-]/g, '')             // Remove all non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-')                      // Spaces to hyphens
    .replace(/-+/g, '-')                       // Collapse multiple hyphens
    .replace(/^-|-$/g, '');                    // Strip leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a city suffix if needed
 * Use this when inserting venues to avoid conflicts (two venues with same name in different cities)
 * Example: "The Place" in Lagos → "the-place-lagos"
 *          "The Place" in Abuja → "the-place-abuja"
 */
export function generateVenueSlug(name: string, city: string): string {
  const baseSlug = generateSlug(name);
  const citySlug = generateSlug(city);
  return `${baseSlug}-${citySlug}`;
}

/**
 * Validate that a slug is properly formatted
 * Used to sanity-check slugs before inserting into the DB
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
