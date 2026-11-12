/** Lowercase ASCII words joined by hyphens, safe for any file system. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "api";
}

const FORBIDDEN_IN_FILE_NAMES = /[<>:"/\\|?*]/g;

/** Keeps the name readable but drops what file systems forbid. */
export function fileName(name: string): string {
  const safe = name
    .replace(FORBIDDEN_IN_FILE_NAMES, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return safe || "request";
}
