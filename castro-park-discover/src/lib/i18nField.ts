/**
 * Resolves a multilingual field that can be either:
 * - A plain string (legacy format — current Supabase TEXT columns)
 * - A JSONB object { pt: "...", en: "...", es: "..." } (future migrated format)
 *
 * Usage:
 *   resolveI18nField(place.description, currentLang)
 */

export type I18nField = string | { pt?: string; en?: string; es?: string } | null | undefined;

export function resolveI18nField(
  field: I18nField,
  lang: string,
  fallback = ""
): string {
  if (!field) return fallback;
  if (typeof field === "string") return field;
  const key = lang.slice(0, 2) as "pt" | "en" | "es";
  return field[key] || field.pt || field.en || field.es || fallback;
}
