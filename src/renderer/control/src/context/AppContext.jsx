import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DEFAULT_BG } from '@shared/constants/defaultBackground.js'
import { DEFAULT_PROJECTION_FONT } from '@shared/utils/font.js'
import { DEFAULT_WATERMARK } from '@shared/constants/watermark.js'

const AppContext = createContext(null)

const FONT_MAP = {
  jakarta: "'Plus Jakarta Sans', sans-serif",
  inter:   "'Inter', sans-serif",
  system:  "system-ui, -apple-system, sans-serif",
}

export function AppProvider({ children }) {
  // ── Navegación ──────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('Control')

  // Deep-link del buscador global: {type, payload, ts}. Cada página lo
  // consume en un useEffect y lo limpia; `ts` permite re-seleccionar el
  // mismo ítem dos veces seguidas.
  const [pendingSelection, setPendingSelection] = useState(null)

  const navigateTo = useCallback((page, selection) => {
    setActivePage(page)
    if (selection) setPendingSelection({ ...selection, ts: Date.now() })
  }, [])

  const clearPendingSelection = useCallback(() => setPendingSelection(null), [])

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

  // ── Proyección: monitor, fondo/fuente predeterminados, auto-hide ──────────
  const [activeMonitor,     setActiveMonitorState]     = useState('secondary')
  const [projFontSize,      setProjFontSizeState]      = useState('auto')
  const [projectionFontFamily, setProjectionFontFamilyState] = useState(DEFAULT_PROJECTION_FONT)
  const [autoHideControls,  setAutoHideControlsState]  = useState(false)

  const setActiveMonitor = useCallback(async (val) => {
    setActiveMonitorState(val)
    await window.api?.settings.set('active_monitor', val)
    await window.api?.displays.setActiveMonitor(val)
  }, [])

  const setProjFontSize = useCallback(async (val) => {
    setProjFontSizeState(val)
    window.api?.projection.setFontSize(val)
    await window.api?.settings.set('font_size', val)
  }, [])

  const setProjectionFontFamily = useCallback(async (val) => {
    setProjectionFontFamilyState(val)
    window.api?.projection.setFont(val)
    await window.api?.settings.set('projection_font_family', val)
  }, [])

  const setAutoHideControls = useCallback(async (val) => {
    setAutoHideControlsState(val)
    await window.api?.settings.set('auto_hide_controls', val)
  }, [])

  // ── Marca de agua ──────────────────────────────────────────────────────────
  const [watermark, setWatermarkState] = useState(DEFAULT_WATERMARK)

  const setWatermark = useCallback(async (patch) => {
    const next = { ...watermark, ...patch }
    setWatermarkState(next)
    window.api?.projection.setWatermark(next)
    await window.api?.settings.setMany({
      watermark_enabled:  String(next.enabled),
      watermark_image:    next.image ?? '',
      watermark_position: next.position,
      watermark_opacity:  next.opacity,
      watermark_margin:   next.margin,
    })
  }, [watermark])

  // ── Biblia: versión y formato predeterminados ──────────────────────────────
  const [defaultBibleModule, setDefaultBibleModuleState] = useState(null)
  const [showVerseNumbers,   setShowVerseNumbersState]   = useState(true)

  const setDefaultBibleModule = useCallback(async (val) => {
    setDefaultBibleModuleState(val)
    await window.api?.settings.set('default_bible_module', val)
  }, [])

  const setShowVerseNumbers = useCallback(async (val) => {
    setShowVerseNumbersState(val)
    await window.api?.settings.set('show_verse_numbers', val)
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
  // Vista previa de "lo próximo" — la llena la página activa (Escrituras/Canciones/Presentaciones)
  // para que el panel de Escenario pueda mostrarla. Puramente transitorio, no se persiste.
  const [nextText,    setNextText]    = useState('')
  // Fondo activo — objeto {type, value, id?, name?}, elegido en el editor de fondos (Topbar → "Fondo").
  // null solo hasta que se resuelve el fondo predeterminado guardado en Ajustes.
  const [activeBg,    setActiveBgState] = useState(null)
  const [projCount,   setProjCount]   = useState(0)
  // Último payload enviado a proyección — permite "reencender" tras apagar sin perder el contenido
  const [lastPayload, setLastPayload] = useState(null)

  const setActiveBg = useCallback((bg) => {
    setActiveBgState(bg)
    // Notificar inmediatamente a la ventana de proyección
    if (bg) window.api?.backgrounds?.setActive(bg)
    // Recordarlo como fondo predeterminado para el próximo inicio (único lugar desde donde se cambia: botón «Fondo»)
    if (bg?.id) window.api?.settings.set('default_background_id', bg.id)
  }, [])

  const project = useCallback((text) => {
    const payload = { text, bg: activeBg ?? DEFAULT_BG, fontSize: projFontSize, fontFamily: projectionFontFamily, watermark }
    window.api?.projection.send(payload)
    setLiveText(text)
    setLastPayload(payload)
    setIsLive(true)
    setProjCount(c => c + 1)
  }, [activeBg, projFontSize, projectionFontFamily, watermark])

  const clearProjection = useCallback(() => {
    window.api?.projection.clear()
    setIsLive(false)
    setLiveText('')
    setLastPayload(null)
  }, [])

  // Switch encendido/apagado: apaga sin perder el contenido, reenciende reenviando el último payload
  const toggleProjection = useCallback(() => {
    if (isLive) {
      window.api?.projection.clear()
      setIsLive(false)
      return
    }
    if (!lastPayload) return
    window.api?.projection.send(lastPayload)
    setIsLive(true)
    setProjCount(c => c + 1)
  }, [isLive, lastPayload])

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

      // Cargar ajustes de proyección
      setProjFontSizeState(settings.font_size ?? 'auto')
      setProjectionFontFamilyState(settings.projection_font_family ?? DEFAULT_PROJECTION_FONT)
      setActiveMonitorState(settings.active_monitor ?? 'secondary')
      setAutoHideControlsState(settings.auto_hide_controls === 'true')

      // Cargar el fondo predeterminado — se envía a proyección de inmediato, no solo al proyectar
      if (settings.default_background_id) {
        const bg = await window.api?.backgrounds.findById(Number(settings.default_background_id))
        if (bg) {
          const loadedBg = { type: bg.type, value: bg.value, id: bg.id, name: bg.name, thumbnail: bg.thumbnail ?? null }
          setActiveBgState(loadedBg)
          window.api?.backgrounds?.setActive(loadedBg)
        }
      }

      // Cargar ajustes de Biblia
      setDefaultBibleModuleState(settings.default_bible_module ?? null)
      setShowVerseNumbersState(settings.show_verse_numbers !== 'false')

      // Cargar marca de agua — se envía a proyección de inmediato, no solo al proyectar
      const loadedWatermark = {
        enabled:  settings.watermark_enabled === 'true',
        image:    settings.watermark_image || null,
        position: settings.watermark_position || DEFAULT_WATERMARK.position,
        opacity:  settings.watermark_opacity || DEFAULT_WATERMARK.opacity,
        margin:   settings.watermark_margin || DEFAULT_WATERMARK.margin,
      }
      setWatermarkState(loadedWatermark)
      window.api?.projection.setWatermark(loadedWatermark)

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
      toggleProjection()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyProjToggle, toggleProjection])

  return (
    <AppContext.Provider value={{
      // Navegación
      activePage, setActivePage,
      pendingSelection, navigateTo, clearPendingSelection,
      // Apariencia
      theme, setTheme,
      fontFamily, setFontFamily,
      animationSpeed, setAnimationSpeed,
      // Interacción
      projectionClickMode, setProjClickMode,
      keyNavNext, setKeyNavNext, keyNavPrev, setKeyNavPrev,
      keyProjToggle, setKeyProjToggle,
      isNavNext, isNavPrev,
      activeMonitor, setActiveMonitor,
      projFontSize, setProjFontSize,
      projectionFontFamily, setProjectionFontFamily,
      autoHideControls, setAutoHideControls,
      watermark, setWatermark,
      defaultBibleModule, setDefaultBibleModule,
      showVerseNumbers, setShowVerseNumbers,
      // Biblioteca
      library, libLoading, refreshLibrary, createItem, deleteItem, deleteMany,
      // Proyección
      liveText, isLive, activeBg, setActiveBg, projCount, project, clearProjection, toggleProjection,
      nextText, setNextText,
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