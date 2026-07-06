// Colorimetría y destino de navegación por tipo de resultado del buscador
// global. Alineada con TYPE_BADGES de Sidebar.jsx (song=purple, verse=red,
// announcement=amber). Clases Tailwind completas, sin interpolar (purge).
// Los tintes `bg-x-500/10` funcionan igual en tema claro y oscuro.
export const SEARCH_TYPES = {
  verseRef: {
    label: 'Escritura',
    page:  'Escrituras',
    dot:   'bg-red-500',
    badge: 'bg-red-500/10 text-red-500',
  },
  verse: {
    label: 'Escritura',
    page:  'Escrituras',
    dot:   'bg-red-500',
    badge: 'bg-red-500/10 text-red-500',
  },
  song: {
    label: 'Canciones',
    page:  'Canciones',
    dot:   'bg-purple-500',
    badge: 'bg-purple-500/10 text-purple-500',
  },
  presentation: {
    label: 'Presentaciones',
    page:  'Presentaciones',
    dot:   'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-500',
  },
  media: {
    label: 'Multimedia',
    page:  'Multimedia',
    dot:   'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500',
  },
  library: {
    label: 'Biblioteca',
    page:  'Control',
    dot:   'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-500',
  },
}
