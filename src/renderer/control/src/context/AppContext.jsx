import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Navegación ──────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('Control')

  // ── Tema ────────────────────────────────────────────────────────
  const [theme, setThemeState] = useState('light') // 'light' | 'dark'

  const setTheme = useCallback(async (value) => {
    setThemeState(value)
    document.documentElement.classList.toggle('dark', value === 'dark')
    await window.api?.settings.set('theme', value)
  }, [])

  // ── Biblioteca ──────────────────────────────────────────────────
  const [library, setLibrary]   = useState([])
  const [libLoading, setLibLoading] = useState(true)

  const refreshLibrary = useCallback(async (filters) => {
    setLibLoading(true)
    try {
      const items = await window.api?.library.findAll(filters) ?? []
      setLibrary(items)
    } finally {
      setLibLoading(false)
    }
  }, [])

  const createItem = useCallback(async (data) => {
    const item = await window.api?.library.create(data)
    await refreshLibrary()
    return item
  }, [refreshLibrary])

  const deleteItem = useCallback(async (id) => {
    await window.api?.library.delete(id)
    await refreshLibrary()
  }, [refreshLibrary])

  const deleteMany = useCallback(async (ids) => {
    await Promise.all(ids.map(id => window.api?.library.delete(id)))
    await refreshLibrary()
  }, [refreshLibrary])

  // ── Estado live (proyección) ────────────────────────────────────
  const [liveText,    setLiveText]    = useState('')
  const [isLive,      setIsLive]      = useState(false)
  const [liveBg,      setLiveBg]      = useState('dark')
  const [projCount,   setProjCount]   = useState(0)

  const project = useCallback((text, bg = liveBg) => {
    const payload = { text, bg }
    window.api?.projection.send(payload)
    setLiveText(text)
    setIsLive(true)
    setLiveBg(bg)
    setProjCount(c => c + 1)
  }, [liveBg])

  const clearProjection = useCallback(() => {
    window.api?.projection.clear()
    setIsLive(false)
    setLiveText('')
  }, [])

  // ── Monitores ───────────────────────────────────────────────────
  const [displays, setDisplays] = useState([])

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      // Cargar settings persistidas
      const settings = await window.api?.settings.getAll() ?? {}

      // Aplicar tema guardado
      const savedTheme = settings.theme ?? 'light'
      setThemeState(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')

      // Cargar biblioteca
      await refreshLibrary()

      // Cargar monitores
      const d = await window.api?.displays.getAll() ?? []
      setDisplays(d)
    }
    init()
  }, [refreshLibrary])

  return (
    <AppContext.Provider value={{
      // Navegación
      activePage, setActivePage,
      // Tema
      theme, setTheme,
      // Biblioteca
      library, libLoading, refreshLibrary, createItem, deleteItem, deleteMany,
      // Proyección
      liveText, isLive, liveBg, setLiveBg, projCount, project, clearProjection,
      // Monitores
      displays,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}