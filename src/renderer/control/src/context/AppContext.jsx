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
  // Fondo activo extendido — objeto {type, value, id?, name?}
  // null = usar liveBg (preset legacy)
  const [activeBg,    setActiveBgState] = useState(null)
  const [projCount,   setProjCount]   = useState(0)

  const setActiveBg = useCallback((bg) => {
    setActiveBgState(bg)
    // Notificar inmediatamente a la ventana de proyección
    if (bg) window.api?.backgrounds?.setActive(bg)
  }, [])

  // Obtener el bg que se debe enviar en cada proyección
  // Si hay un activeBg personalizado, usarlo; si no, usar liveBg (preset)
  const currentBgPayload = useCallback(() => {
    if (activeBg) return activeBg
    // Convertir preset string a objeto
    const BG_VALUES = {
      dark:  'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)',
      red:   'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)',
      black: '#000000',
    }
    return { type: 'gradient', value: BG_VALUES[liveBg] ?? BG_VALUES.dark }
  }, [activeBg, liveBg])

  const project = useCallback((text, _legacyBg) => {
    // _legacyBg se ignora si hay un activeBg seleccionado en el panel
    const bgPayload = currentBgPayload()
    const payload = { text, bg: bgPayload }
    window.api?.projection.send(payload)
    setLiveText(text)
    setIsLive(true)
    setProjCount(c => c + 1)
  }, [currentBgPayload])

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
      liveText, isLive, liveBg, setLiveBg, activeBg, setActiveBg, projCount, project, clearProjection,
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