// Slugify utilities with Turkish character support
// Converts Turkish characters, trims, lowercases, and replaces non-alphanumerics with dashes.

const TR_MAP: Record<string, string> = {
  'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
  'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
};

export function slugify(input: string): string {
  if (!input) return '';
  const replaced = input
    .split('')
    .map(ch => TR_MAP[ch] ?? ch)
    .join('');
  return replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80); // limit length
}

// Generate slug with optional suffix for collision handling
// If publicId provided (e.g., "ORG-A1B2C"), appends first 3 chars as suffix
export function generateSlugWithSuffix(name: string, publicId?: string): string {
  const baseSlug = slugify(name);
  if (!publicId) return baseSlug;
  
  // Extract suffix from publicId (e.g., "ORG-A1B2C" -> "a1b")
  const suffix = publicId.split('-')[1]?.substring(0, 3).toLowerCase() || 'x';
  return `${baseSlug}-${suffix}`;
}
