import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, SectionLabel } from '@shared/components/ui/index.jsx'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'
import { buildFontFamily, calcAutoFontSize } from '@shared/utils/font.js'
import { WATERMARK_MARGIN_MAP, WATERMARK_OPACITY_MAP } from '@shared/constants/watermark.js'
import { DEFAULT_BG } from '@shared/constants/defaultBackground.js'
import { cn } from '@shared/utils/cn.js'

// Ancho de referencia (px) del lienzo de preview — sirve para escalar el tamaño
// de fuente personalizado a como se vería realmente en una proyección de 1920px
const PREVIEW_REF_WIDTH  = 480
const PREVIEW_REAL_WIDTH = 1920
const PREVIEW_SCALE      = PREVIEW_REF_WIDTH / PREVIEW_REAL_WIDTH

// ─── Iconos ───────────────────────────────────────────────────────────────────
const MonitorIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const PaletteIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1 0-.27-.11-.52-.29-.71-.18-.19-.29-.44-.29-.71 0-.55.45-1 1-1h1.18c3.03 0 5.5-2.47 5.5-5.5C20.1 5.48 16.62 2 12 2z" />
    <circle cx="6.5" cy="11.5" r="1.5" />
    <circle cx="9.5" cy="7.5" r="1.5" />
    <circle cx="14.5" cy="7.5" r="1.5" />
    <circle cx="17.5" cy="11.5" r="1.5" />
  </svg>
)

const TypeIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)

const WatermarkIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
)

const DatabaseIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

const InfoIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const KeyIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)

const ClickIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
  </svg>
)

const FolderIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

// ─── Componente de Sección ────────────────────────────────────────────────────
function SettingSection({ icon, title, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-surface-muted dark:border-dark-border">
        <div className="text-brand-500 dark:text-brand-400">{icon}</div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  )
}

// ─── Componente de Setting Individual ─────────────────────────────────────────
function SettingItem({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )
}

// ─── Apariencia de proyección: fuente + tamaño (100% personalizable) ──────────
// Un único borrador y una única preview para fuente y tamaño — nada se aplica
// a la proyección real hasta pulsar "Aplicar cambios". El fondo no se edita aquí:
// solo se muestra el nombre del actual; para cambiarlo usa el botón «Fondo» de la barra superior.
function ProjectionAppearanceSetting({ fontFamily, fonts, fontSize, currentBackgroundName, onSave }) {
  const [draftFont,   setDraftFont]   = useState(fontFamily)
  const [draftAuto,   setDraftAuto]   = useState(!fontSize || fontSize === 'auto')
  const [draftSize,   setDraftSize]   = useState(Number(fontSize) > 0 ? Number(fontSize) : 64)
  const [sample,      setSample]      = useState('Así se verá el texto proyectado')

  // Sincronizar borradores si el ajuste guardado cambia desde fuera (p. ej. carga inicial)
  useEffect(() => { setDraftFont(fontFamily) }, [fontFamily])
  useEffect(() => {
    setDraftAuto(!fontSize || fontSize === 'auto')
    if (Number(fontSize) > 0) setDraftSize(Number(fontSize))
  }, [fontSize])

  const draftFontSizeValue = draftAuto ? 'auto' : String(draftSize)
  const dirty = draftFont !== fontFamily || draftFontSizeValue !== (fontSize || 'auto')

  const realSize = draftAuto ? calcAutoFontSize(sample) : draftSize

  return (
    <div className="flex flex-col gap-4">
      {/* Fuente */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Fuente de proyección</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tipografía del texto proyectado (fuentes instaladas en este equipo)</p>
        </div>
        <Select value={draftFont} onChange={(e) => setDraftFont(e.target.value)} className="w-48 flex-shrink-0">
          {!fonts.includes(draftFont) && (
            <option value={draftFont} style={{ fontFamily: buildFontFamily(draftFont) }}>{draftFont}</option>
          )}
          {fonts.map(font => (
            <option key={font} value={font} style={{ fontFamily: buildFontFamily(font) }}>{font}</option>
          ))}
        </Select>
      </div>

      {/* Tamaño de fuente — 100% personalizado en px, o automático según el texto */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Tamaño de fuente</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Define un tamaño exacto en píxeles, o deja que se ajuste solo según el texto</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0 cursor-pointer select-none">
          <input type="checkbox" checked={draftAuto} onChange={(e) => setDraftAuto(e.target.checked)} className="accent-brand-500" />
          Automático
        </label>
      </div>

      {!draftAuto && (
        <div className="flex items-center gap-3 -mt-1">
          <input
            type="range" min="16" max="200" value={draftSize}
            onChange={(e) => setDraftSize(+e.target.value)}
            className="flex-1 accent-brand-500"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number" min="8" max="400" value={draftSize}
              onChange={(e) => setDraftSize(Math.max(8, Math.min(400, +e.target.value || 8)))}
              className="w-16 px-2 py-1 text-sm rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
            />
            <span className="text-xs text-slate-400">px</span>
          </div>
        </div>
      )}

      {/* Fondo predeterminado — solo informativo; se cambia desde el botón «Fondo» de la barra superior */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Fondo predeterminado</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Se cambia desde el botón «Fondo» en la barra superior del panel de control</p>
        </div>
        <span className="text-[13px] font-semibold text-brand-500 flex-shrink-0">{currentBackgroundName}</span>
      </div>

      {/* Preview compartida — refleja la fuente y el tamaño elegidos arriba (fondo neutro fijo) */}
      <div>
        <SectionLabel className="mb-1.5">Así se verá el texto proyectado</SectionLabel>
        <div className="slide-canvas w-full" style={{ maxWidth: PREVIEW_REF_WIDTH }}>
          <div className="absolute inset-0" style={{ background: DEFAULT_BG.value }} />
          <span className="absolute top-2 left-2.5 font-mono text-[9px] text-white/20 tracking-wider select-none">PREVIEW</span>
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden">
            <p
              className="text-white font-extrabold text-center leading-snug whitespace-pre-wrap break-words"
              style={{
                fontFamily: buildFontFamily(draftFont),
                fontSize: `${Math.max(6, Math.round(realSize * PREVIEW_SCALE))}px`,
                textShadow: '0 2px 24px rgba(0,0,0,.8)',
                maxWidth: '100%',
              }}
            >
              {sample.trim() || 'Vista previa'}
            </p>
          </div>
        </div>
        <input
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="Escribe un texto de muestra…"
          className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 outline-none focus:border-brand-500"
          style={{ maxWidth: PREVIEW_REF_WIDTH }}
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => onSave({ fontFamily: draftFont, fontSize: draftFontSizeValue })}
        >
          Aplicar cambios
        </Button>
      </div>
    </div>
  )
}

// ─── Selector visual de esquina (marca de agua) ───────────────────────────────
const CORNERS = [
  { key: 'top-left',     pos: 'top-1 left-1' },
  { key: 'top-right',    pos: 'top-1 right-1' },
  { key: 'bottom-left',  pos: 'bottom-1 left-1' },
  { key: 'bottom-right', pos: 'bottom-1 right-1' },
]

function CornerPicker({ value, onChange }) {
  return (
    <div className="relative w-16 h-11 rounded-md border border-surface-muted dark:border-dark-border bg-slate-100 dark:bg-slate-800 flex-shrink-0">
      {CORNERS.map(c => (
        <button
          key={c.key}
          type="button"
          title={c.key}
          onClick={() => onChange(c.key)}
          className={cn(
            'absolute w-3 h-3 rounded-sm transition-colors',
            c.pos,
            value === c.key
              ? 'bg-brand-500'
              : 'bg-slate-300 dark:bg-slate-600 hover:bg-brand-300 dark:hover:bg-brand-700',
          )}
        />
      ))}
    </div>
  )
}

// ─── Marca de agua: carga de logo, posición, opacidad y margen ────────────────
function WatermarkSetting({ watermark, onChange }) {
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState(null)

  const handlePick = async () => {
    setError(null)
    setBusy(true)
    try {
      const result = await window.api?.watermark.pickImage()
      if (!result) return
      if (result.error) { setError(result.error); return }
      onChange({ image: result.dataUrl, enabled: true })
    } finally {
      setBusy(false)
    }
  }

  // Margen escalado para el preview 16:9 (los valores reales están pensados para pantalla completa)
  const previewMargin = Math.max(4, Math.round((WATERMARK_MARGIN_MAP[watermark.margin] ?? 32) / 6))

  return (
    <>
      <SettingItem
        label="Activar marca de agua"
        description="Muestra un logo con opacidad en una esquina de la proyección"
      >
        <Toggle checked={watermark.enabled} onChange={(v) => onChange({ enabled: v })} />
      </SettingItem>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Logo</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PNG, JPG, WEBP, GIF o SVG — máx. 5 MB</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {watermark.image && (
            <img
              src={watermark.image}
              alt=""
              className="w-9 h-9 rounded-md object-contain border border-surface-muted dark:border-dark-border bg-slate-900"
            />
          )}
          <Button variant="secondary" size="sm" onClick={handlePick} disabled={busy}>
            {busy ? 'Cargando…' : watermark.image ? 'Cambiar' : 'Cargar imagen'}
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Posición</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esquina donde aparece el logo</p>
        </div>
        <CornerPicker value={watermark.position} onChange={(position) => onChange({ position })} />
      </div>

      <SettingItem label="Opacidad" description="Transparencia del logo">
        <Select
          value={watermark.opacity}
          onChange={(e) => onChange({ opacity: e.target.value })}
          className="w-32"
        >
          <option value="low">25%</option>
          <option value="medium">50%</option>
          <option value="high">75%</option>
          <option value="full">100%</option>
        </Select>
      </SettingItem>

      <SettingItem label="Margen" description="Distancia respecto al borde">
        <Select
          value={watermark.margin}
          onChange={(e) => onChange({ margin: e.target.value })}
          className="w-32"
        >
          <option value="small">Pequeño</option>
          <option value="medium">Mediano</option>
          <option value="large">Grande</option>
        </Select>
      </SettingItem>

      {watermark.enabled && watermark.image && (
        <div className="slide-canvas w-full max-w-sm">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #000010 100%)' }} />
          <span className="absolute top-2 left-2.5 font-mono text-[9px] text-white/20 tracking-wider select-none">PREVIEW</span>
          <img
            src={watermark.image}
            alt=""
            className="absolute"
            style={{
              maxWidth: '20%', maxHeight: '20%',
              opacity: WATERMARK_OPACITY_MAP[watermark.opacity] ?? WATERMARK_OPACITY_MAP.medium,
              top:    watermark.position.startsWith('top')    ? previewMargin : undefined,
              bottom: watermark.position.startsWith('bottom') ? previewMargin : undefined,
              left:   watermark.position.endsWith('left')     ? previewMargin : undefined,
              right:  watermark.position.endsWith('right')    ? previewMargin : undefined,
            }}
          />
        </div>
      )}
    </>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'dark:focus:ring-offset-dark-bg',
        checked
          ? 'bg-brand-500'
          : 'bg-slate-200 dark:bg-slate-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

// ─── Mapa de nombres de teclas ────────────────────────────────────────────────
const KEY_NAMES = {
  'ArrowRight': '→', 'ArrowLeft': '←', 'ArrowUp': '↑', 'ArrowDown': '↓',
  ' ': 'Espacio', 'Backspace': '⌫', 'Enter': '↵ Enter', 'Escape': 'Esc',
  'Tab': '⇥ Tab', 'Delete': 'Supr', 'Home': 'Inicio', 'End': 'Fin',
  'PageUp': 'Re Pág', 'PageDown': 'Av Pág',
  'F1':'F1','F2':'F2','F3':'F3','F4':'F4','F5':'F5','F6':'F6',
  'F7':'F7','F8':'F8','F9':'F9','F10':'F10','F11':'F11','F12':'F12',
}

// ─── Captura de tecla ─────────────────────────────────────────────────────────
function KeyCapture({ value, defaultValue, onChange }) {
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!capturing) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') { setCapturing(false); return }
      if (['Control','Alt','Shift','Meta'].includes(e.key)) return
      onChange(e.key)
      setCapturing(false)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [capturing, onChange])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCapturing(true)}
        className={cn(
          'min-w-[100px] px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-all text-center',
          capturing
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-500 dark:text-brand-400 animate-pulse'
            : 'border-surface-muted dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-700 cursor-pointer',
        )}
      >
        {capturing ? 'Presiona…' : (KEY_NAMES[value] || value)}
      </button>
      {value !== defaultValue && (
        <button
          onClick={() => onChange(defaultValue)}
          title="Restablecer"
          className="text-[13px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          ↺
        </button>
      )}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export function SettingsPage() {
  const { theme, setTheme, fontFamily, setFontFamily, animationSpeed, setAnimationSpeed,
          displays, projectionClickMode, setProjClickMode,
          keyNavNext, setKeyNavNext, keyNavPrev, setKeyNavPrev,
          keyProjToggle, setKeyProjToggle,
          activeMonitor, setActiveMonitor,
          projFontSize, setProjFontSize,
          projectionFontFamily, setProjectionFontFamily,
          autoHideControls, setAutoHideControls,
          watermark, setWatermark,
          activeBg,
          defaultBibleModule, setDefaultBibleModule,
          showVerseNumbers, setShowVerseNumbers } = useApp()

  // Módulos bíblicos instalados (para el select de versión predeterminada)
  const [bibleModules, setBibleModules] = useState([])
  useEffect(() => {
    window.api?.bible.listModules().then(mods => setBibleModules(mods ?? []))
  }, [])

  // Versión real de la app (package.json, vía app.getVersion())
  const [appVersion, setAppVersion] = useState(null)
  useEffect(() => {
    window.api?.app.getVersion().then(setAppVersion)
  }, [])

  // Fuentes instaladas en el sistema (para el select de fuente de proyección)
  const [systemFonts, setSystemFonts] = useState([])
  useEffect(() => {
    window.api?.fonts.getAll().then(list => setSystemFonts(list ?? []))
  }, [])

  // Ajustes cuyo efecto real todavía no está implementado (backup, updates…)
  const [settings, setSettings] = useState({
    // Base de datos
    auto_backup: true,
    backup_frequency: 'weekly',

    // General
    check_updates: true,
    start_on_login: false,
  })

  // Cargar configuración al montar
  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await window.api?.settings.getAll()
        if (!s) return
        setSettings(prev => ({
          ...prev,
          ...(s.backup_frequency && { backup_frequency: s.backup_frequency }),
          // coercionar booleanos almacenados como string
          auto_backup:    s.auto_backup    !== 'false',
          check_updates:  s.check_updates  !== 'false',
          start_on_login: s.start_on_login === 'true',
        }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    try {
      await window.api?.settings.set(key, value)
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  const handleOpenBiblesDir = async () => {
    await window.api?.bible.openBiblesDir()
  }

  // ── Respaldo: exportar/importar la base de datos completa ─────────────────
  const [backupBusy,    setBackupBusy]    = useState(false)
  const [backupMsg,     setBackupMsg]     = useState(null) // { type: 'ok'|'error', text }
  const [confirmImport, setConfirmImport] = useState(false)

  const handleExportData = async () => {
    setBackupBusy(true)
    setBackupMsg(null)
    try {
      const result = await window.api?.backup.export()
      if (result?.canceled) return
      if (result?.error) setBackupMsg({ type: 'error', text: result.error })
      else setBackupMsg({ type: 'ok', text: `Respaldo guardado en ${result.path}` })
    } finally {
      setBackupBusy(false)
    }
  }

  const runImport = async () => {
    setConfirmImport(false)
    setBackupBusy(true)
    setBackupMsg(null)
    try {
      const result = await window.api?.backup.import()
      if (result?.canceled) return
      if (result?.error) setBackupMsg({ type: 'error', text: result.error })
      // Si tiene éxito la app se reinicia sola — no hay nada más que hacer aquí
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Ajustes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configura Open Screen según tus preferencias
          </p>
        </div>

        {/* Apariencia */}
        <SettingSection icon={<PaletteIcon />} title="Apariencia">
          <SettingItem 
            label="Tema" 
            description="Elige entre tema claro u oscuro"
          >
            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-36"
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </Select>
          </SettingItem>

          <SettingItem
            label="Fuente"
            description="Fuente tipográfica para la interfaz"
          >
            <Select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-48"
            >
              <option value="jakarta">Plus Jakarta Sans</option>
              <option value="inter">Inter</option>
              <option value="system">Sistema</option>
            </Select>
          </SettingItem>

          <SettingItem
            label="Velocidad de animaciones"
            description="Controla la velocidad de las transiciones en la interfaz"
          >
            <Select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(e.target.value)}
              className="w-36"
            >
              <option value="slow">Lenta</option>
              <option value="normal">Normal</option>
              <option value="fast">Rápida</option>
            </Select>
          </SettingItem>
        </SettingSection>

        {/* Interacción */}
        <SettingSection icon={<ClickIcon />} title="Interacción">
          <SettingItem
            label="Proyectar al hacer clic"
            description="Un clic proyecta de inmediato; doble clic lo confirma primero"
          >
            <Select
              value={projectionClickMode}
              onChange={(e) => setProjClickMode(e.target.value)}
              className="w-44"
            >
              <option value="double">Doble clic</option>
              <option value="single">Un solo clic</option>
            </Select>
          </SettingItem>

          <SettingItem
            label="Tecla: avanzar"
            description="Siguiente versículo o sección durante la proyección"
          >
            <KeyCapture value={keyNavNext} defaultValue="ArrowRight" onChange={setKeyNavNext} />
          </SettingItem>

          <SettingItem
            label="Tecla: retroceder"
            description="Versículo o sección anterior durante la proyección"
          >
            <KeyCapture value={keyNavPrev} defaultValue="ArrowLeft" onChange={setKeyNavPrev} />
          </SettingItem>

          <SettingItem
            label="Tecla: proyectar / quitar"
            description="Oculta o muestra la proyección desde cualquier página"
          >
            <KeyCapture value={keyProjToggle} defaultValue="F12" onChange={setKeyProjToggle} />
          </SettingItem>
        </SettingSection>

        {/* Proyección */}
        <SettingSection icon={<MonitorIcon />} title="Proyección">
          <SettingItem
            label="Monitor activo"
            description="Selecciona en qué pantalla proyectar"
          >
            <Select
              value={activeMonitor}
              onChange={(e) => setActiveMonitor(e.target.value)}
              className="w-44"
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secundaria</option>
              {displays.length > 2 && <option value="third">Tercera</option>}
            </Select>
          </SettingItem>

          <SettingItem
            label="Ocultar controles automáticamente"
            description="Esconde controles al proyectar en pantalla completa (solo con 1 monitor)"
          >
            <Toggle
              checked={autoHideControls}
              onChange={setAutoHideControls}
            />
          </SettingItem>

          <ProjectionAppearanceSetting
            fontFamily={projectionFontFamily}
            fonts={systemFonts}
            fontSize={projFontSize}
            currentBackgroundName={activeBg?.name ?? 'Oscuro (predeterminado)'}
            onSave={({ fontFamily, fontSize }) => {
              setProjectionFontFamily(fontFamily)
              setProjFontSize(fontSize)
            }}
          />
        </SettingSection>

        {/* Marca de agua */}
        <SettingSection icon={<WatermarkIcon />} title="Marca de agua">
          <WatermarkSetting watermark={watermark} onChange={setWatermark} />
        </SettingSection>

        {/* Biblias */}
        <SettingSection icon={<TypeIcon />} title="Biblias">
          <SettingItem
            label="Versión predeterminada"
            description="Biblia que se abre por defecto"
          >
            <Select
              value={defaultBibleModule ?? ''}
              onChange={(e) => setDefaultBibleModule(e.target.value)}
              className="w-44"
              disabled={bibleModules.length === 0}
            >
              {bibleModules.length === 0 && <option value="">Sin módulos instalados</option>}
              {bibleModules.map(m => (
                <option key={m.id} value={m.id}>{m.abbreviation} — {m.name}</option>
              ))}
            </Select>
          </SettingItem>

          <SettingItem
            label="Mostrar números de versículo"
            description="Incluir numeración en proyección"
          >
            <Toggle
              checked={showVerseNumbers}
              onChange={setShowVerseNumbers}
            />
          </SettingItem>

          <SettingItem 
            label="Carpeta de biblias" 
            description="Administra tus módulos .osb"
          >
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenBiblesDir}
            >
              <FolderIcon />
              Abrir carpeta
            </Button>
          </SettingItem>
        </SettingSection>

        {/* Base de datos */}
        <SettingSection icon={<DatabaseIcon />} title="Base de datos">
          <SettingItem 
            label="Respaldo automático" 
            description="Crear copias de seguridad automáticas"
          >
            <Toggle
              checked={settings.auto_backup}
              onChange={(val) => updateSetting('auto_backup', val)}
            />
          </SettingItem>

          <SettingItem
            label="Frecuencia de respaldo"
            description="Cada cuánto hacer backup"
          >
            <Select
              value={settings.backup_frequency}
              onChange={(e) => updateSetting('backup_frequency', e.target.value)}
              className="w-36"
              disabled={!settings.auto_backup}
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </Select>
          </SettingItem>

          <SettingItem
            label="Exportar/Importar"
            description="Migra tu contenido a otro equipo"
          >
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={backupBusy}
                  onClick={handleExportData}
                >
                  Exportar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={backupBusy}
                  onClick={() => setConfirmImport(true)}
                >
                  Importar
                </Button>
              </div>
              {backupMsg && (
                <p className={cn(
                  'text-[11px] max-w-[220px] text-right',
                  backupMsg.type === 'error' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400',
                )}>
                  {backupMsg.text}
                </p>
              )}
            </div>
          </SettingItem>
        </SettingSection>

        <ConfirmModal
          open={confirmImport}
          title="Importar respaldo"
          message="Se reemplazará toda la información actual (biblioteca, canciones, presentaciones, fondos) con el contenido del archivo que elijas. Se creará un respaldo de seguridad automático antes de continuar, y la app se reiniciará al terminar. ¿Continuar?"
          confirmLabel="Elegir archivo e importar"
          onConfirm={runImport}
          onCancel={() => setConfirmImport(false)}
        />

        {/* General */}
        <SettingSection icon={<GlobeIcon />} title="General">
          <SettingItem
            label="Idioma"
            description="Por ahora Open Screen solo está disponible en español"
          >
            <Select value="es" disabled className="w-36">
              <option value="es">Español</option>
            </Select>
          </SettingItem>

          <SettingItem 
            label="Buscar actualizaciones" 
            description="Notificar cuando haya nueva versión"
          >
            <Toggle
              checked={settings.check_updates}
              onChange={(val) => updateSetting('check_updates', val)}
            />
          </SettingItem>

          <SettingItem
            label="Iniciar con el sistema"
            description="Abrir Open Screen al encender el equipo"
          >
            <Toggle
              checked={settings.start_on_login}
              onChange={(val) => updateSetting('start_on_login', val)}
            />
          </SettingItem>
        </SettingSection>

        {/* Acerca de */}
        <SettingSection icon={<InfoIcon />} title="Acerca de">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Versión</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{appVersion ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Licencia</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">MIT</span>
            </div>
            <div className="pt-3 border-t border-surface-muted dark:border-dark-border">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Open Screen — Software de proyección para iglesias y eventos.
                Desarrollado con ❤️ por la comunidad.
              </p>
            </div>
          </div>
        </SettingSection>

        {/* Espacio final */}
        <div className="h-8" />
      </div>
    </main>
  )
}