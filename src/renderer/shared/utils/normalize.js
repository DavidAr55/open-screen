/**
 * Normaliza texto para comparaciones insensibles a mayúsculas y tildes:
 * minúsculas + NFD sin diacríticos. Misma lógica que usa el parser de
 * referencias bíblicas del proceso main (src/main/utils/bibleReference.js).
 */
export function normalizeText(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
