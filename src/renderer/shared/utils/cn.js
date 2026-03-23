/**
 * Merge de clases Tailwind sin dependencias externas.
 * Filtra falsy values y une con espacio.
 *
 * Uso: cn('px-4 py-2', isActive && 'bg-brand-600', className)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
