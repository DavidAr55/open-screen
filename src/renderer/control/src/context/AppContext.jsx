import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

const FONT_MAP = {
  jakarta: "'Plus Jakarta Sans', sans-serif",
  inter:   "'Inter', sans-serif",
  system:  "system-ui, -apple-system, sans-serif",
}

export function AppProvider({ children }) {
  // ── Navegación ──────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('Control')

  // ── Apariencia ────────────────────────────────────────────────────────────
  const [theme, setThemeState] = useState('light') // 'light' | 'dark'
  const [fontFamily, setFontFamilyState] = useState('jakarta')
  const [animationSpeed, setAnimationSpeedState] = useState('normal')

  const setTheme = useCallback(async (value) => {
    setThemeState(value)
    document.documentElement.classList.toggle('dark', value === 'dark')
    await window.api?.settings.set('theme', value)
  }, [])

  const setFontFamily = useCallback(async (val) => {
    setFontFamilyState(val)
    document.body.style.fontFamily = FONT_MAP[val] ?? FONT_MAP.jakarta
    await window.api?.settings.set('font_family', val)
  }, [])

  const setAnimationSpeed = useCallback(async (val) => {
    setAnimationSpeedState(val)
    document.documentElement.classList.remove('anim-slow', 'anim-fast')
    if (val === 'slow') document.documentElement.classList.add('anim-slow')
    if (val === 'fast') document.documentElement.classList.add('anim-fast')
    await window.api?.settings.set('animation_speed', val)
  }, [])

  // ── Interacción ──────────────────────────────────────────────────────────
  const [projectionClickMode, setProjClickModeState] = useState('double')
  const [keyNavNext,    setKeyNavNextState]    = useState('ArrowRight')
  const [keyNavPrev,    setKeyNavPrevState]    = useState('ArrowLeft')
  const [keyProjToggle, setKeyProjToggleState] = useState('F12')

  const setProjClickMode = useCallback(async (val) => {
    setProjClickModeState(val)
    await window.api?.settings.set('projection_click_mode', val)
  }, [])

  const setKeyNavNext = useCallback(async (val) => {
    setKeyNavNextState(val)
    await window.api?.settings.set('key_nav_next', val)
  }, [])

  const setKeyNavPrev = useCallback(async (val) => {
    setKeyNavPrevState(val)
    await window.api?.settings.set('key_nav_prev', val)
  }, [])

  const setKeyProjToggle = useCallback(async (val) => {
    setKeyProjToggleState(val)
    await window.api?.settings.set('key_proj_toggle', val)
  }, [])

  const isNavNext = useCallback((key) => key === keyNavNext, [keyNavNext])
  const isNavPrev = useCallback((key) => key === keyNavPrev, [keyNavPrev])

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

      // Aplicar fuente guardada
      const savedFont = settings.font_family ?? 'jakarta'
      setFontFamilyState(savedFont)
      document.body.style.fontFamily = FONT_MAP[savedFont] ?? FONT_MAP.jakarta

      // Aplicar velocidad de animación guardada
      const savedSpeed = settings.animation_speed ?? 'normal'
      setAnimationSpeedState(savedSpeed)
      document.documentElement.classList.remove('anim-slow', 'anim-fast')
      if (savedSpeed === 'slow') document.documentElement.classList.add('anim-slow')
      if (savedSpeed === 'fast') document.documentElement.classList.add('anim-fast')

      // Cargar ajustes de interacción
      setProjClickModeState(settings.projection_click_mode ?? 'double')
      setKeyNavNextState(settings.key_nav_next ?? 'ArrowRight')
      setKeyNavPrevState(settings.key_nav_prev ?? 'ArrowLeft')
      setKeyProjToggleState(settings.key_proj_toggle ?? 'F12')

      // Cargar biblioteca
      await refreshLibrary()

      // Cargar monitores
      const d = await window.api?.displays.getAll() ?? []
      setDisplays(d)
    }
    init()
  }, [refreshLibrary])

  // ── Atajo global: toggle proyección ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key !== keyProjToggle) return
      e.preventDefault()
      if (isLive) clearProjection()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyProjToggle, isLive, clearProjection])

  return (
    <AppContext.Provider value={{
      // Navegación
      activePage, setActivePage,
      // Apariencia
      theme, setTheme,
      fontFamily, setFontFamily,
      animationSpeed, setAnimationSpeed,
      // Interacción
      projectionClickMode, setProjClickMode,
      keyNavNext, setKeyNavNext, keyNavPrev, setKeyNavPrev,
      keyProjToggle, setKeyProjToggle,
      isNavNext, isNavPrev,
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