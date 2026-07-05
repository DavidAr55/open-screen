/**
 * Helpers compartidos para construir consultas SQL seguras
 * a partir de input libre del usuario.
 */

/**
 * Escapa los caracteres especiales de LIKE (\, %, _) para uso seguro
 * con ESCAPE '\' en consultas SQLite construidas con input de usuario.
 */
export function escapeLike(str) {
  return String(str).replace(/[\\%_]/g, '\\$&')
}

/**
 * Sanitiza un término de búsqueda libre para FTS5 MATCH:
 * tokeniza por espacios, quita comillas dobles de cada token,
 * envuelve cada token como prefijo `"tok"*` y une con espacio.
 * Retorna null si no queda ningún token válido (no ejecutar MATCH).
 */
export function sanitizeFtsQuery(query) {
  const tokens = String(query ?? '')
    .trim()
    .split(/\s+/)
    .map(t => t.replace(/"/g, ''))
    .filter(Boolean)
  if (tokens.length === 0) return null
  return tokens.map(t => `"${t}"*`).join(' ')
}
