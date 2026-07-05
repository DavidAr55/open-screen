// Colorimetría y destino de navegación por tipo de resultado del buscador
// global. Alineada con TYPE_BADGES de Sidebar.jsx (song=purple, verse=red,
// announcement=amber). Clases Tailwind completas, sin interpolar (purge).
export const SEARCH_TYPES = {
  verseRef: {
    label: 'Escritura',
    page:  'Escrituras',
    dot:   'bg-red-500',
    badge: 'bg-red-50 dark:bg-red-950/30 text-red-500',
  },
  verse: {
    label: 'Escritura',
    page:  'Escrituras',
    dot:   'bg-red-500',
    badge: 'bg-red-50 dark:bg-red-950/30 text-red-500',
  },
  song: {
    label: 'Canciones',
    page:  'Canciones',
    dot:   'bg-purple-500',
    badge: 'bg-purple-50 dark:bg-purple-950/30 text-purple-500',
  },
  presentation: {
    label: 'Presentaciones',
    page:  'Presentaciones',
    dot:   'bg-blue-500',
    badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-500',
  },
  media: {
    label: 'Multimedia',
    page:  'Multimedia',
    dot:   'bg-emerald-500',
    badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500',
  },
  library: {
    label: 'Biblioteca',
    page:  'Control',
    dot:   'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500',
  },
}
