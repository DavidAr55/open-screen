import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'

/**
 * Hook que expone la biblioteca filtrada por búsqueda y tipo,
 * más el ítem actualmente seleccionado.
 */
export function useLibrary() {
  const { library, libLoading, createItem, deleteItem, project } = useApp()

  const [search,   setSearch]   = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)

  const filtered = useMemo(() => {
    return library.filter(item => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())

      const matchType = typeFilter === 'all' || item.type === typeFilter

      return matchSearch && matchType
    })
  }, [library, search, typeFilter])

  const activeItem = useMemo(
    () => library.find(i => i.id === activeId) ?? null,
    [library, activeId]
  )

  return {
    items: filtered,
    loading: libLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    activeId, setActiveId,
    activeItem,
    createItem,
    deleteItem,
    projectItem: (item) => project(item.content),
  }
}
