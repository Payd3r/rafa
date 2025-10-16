/**
 * Converte un titolo in slug URL-friendly
 * Esempi:
 * - "Ritratti Urbani" -> "ritratti-urbani"
 * - "Linee & Ombre" -> "linee-ombre"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9]+/g, '-') // Sostituisce caratteri non alfanumerici con -
    .replace(/^-+|-+$/g, ''); // Rimuove - iniziali e finali
}

/**
 * Genera uno slug unico controllando se esiste già
 */
export function generateUniqueSlug(title, existingSlugs) {
  let slug = slugify(title);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${slugify(title)}-${counter}`;
    counter++;
  }
  
  return slug;
}

