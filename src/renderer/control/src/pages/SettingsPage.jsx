import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, SectionLabel } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

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
          keyProjToggle, setKeyProjToggle } = useApp()
  
  // Estados temporales para las opciones (de momento no hacen nada real)
  const [settings, setSettings] = useState({
    // Proyección
    activeMonitor: 'secondary',
    projectionBg: 'dark',
    autoHideControls: false,
    
    // Apariencia
    fontSize: 'auto',
    fontFamily: 'Plus Jakarta Sans',
    animationSpeed: 'normal',
    
    // Biblias
    defaultVersion: 'rv1960',
    showVerseNumbers: true,
    
    // Base de datos
    autoBackup: true,
    backupFrequency: 'weekly',
    
    // General
    language: 'es',
    checkUpdates: true,
    startOnLogin: false,
  })

  // Cargar configuración al montar
  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await window.api?.settings.getAll()
        if (!s) return
        setSettings(prev => ({
          ...prev,
          ...(s.activeMonitor    && { activeMonitor:    s.activeMonitor }),
          ...(s.projectionBg     && { projectionBg:     s.projectionBg }),
          ...(s.fontSize         && { fontSize:         s.fontSize }),
          ...(s.fontFamily       && { fontFamily:       s.fontFamily }),
          ...(s.animationSpeed   && { animationSpeed:   s.animationSpeed }),
          ...(s.defaultVersion   && { defaultVersion:   s.defaultVersion }),
          ...(s.backupFrequency  && { backupFrequency:  s.backupFrequency }),
          ...(s.language         && { language:         s.language }),
          // coercionar booleanos almacenados como string
          autoHideControls: s.autoHideControls === 'true',
          showVerseNumbers: s.showVerseNumbers !== 'false',
          autoBackup:       s.autoBackup       !== 'false',
          checkUpdates:     s.checkUpdates     !== 'false',
          startOnLogin:     s.startOnLogin     === 'true',
        }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // Aquí puedes guardar en la base de datos si lo deseas
    try {
      await window.api?.settings.set(key, value)
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  const handleOpenBiblesDir = async () => {
    await window.api?.bible.openBiblesDir()
  }

  const handleExportData = () => {
    console.log('Exportar datos...')
    // TODO: Implementar exportación
  }

  const handleImportData = () => {
    console.log('Importar datos...')
    // TODO: Implementar importación
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
              value={settings.activeMonitor}
              onChange={(e) => updateSetting('activeMonitor', e.target.value)}
              className="w-44"
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secundaria</option>
              {displays.length > 2 && <option value="third">Tercera</option>}
            </Select>
          </SettingItem>

          <SettingItem 
            label="Fondo predeterminado" 
            description="Fondo que se usa al iniciar"
          >
            <Select
              value={settings.projectionBg}
              onChange={(e) => updateSetting('projectionBg', e.target.value)}
              className="w-36"
            >
              <option value="dark">Oscuro</option>
              <option value="red">Rojo</option>
              <option value="black">Negro</option>
            </Select>
          </SettingItem>

          <SettingItem 
            label="Ocultar controles automáticamente" 
            description="Esconde controles al proyectar en pantalla completa"
          >
            <Toggle
              checked={settings.autoHideControls}
              onChange={(val) => updateSetting('autoHideControls', val)}
            />
          </SettingItem>

          <SettingItem 
            label="Tamaño de fuente" 
            description="Tamaño de texto en proyección"
          >
            <Select
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', e.target.value)}
              className="w-36"
            >
              <option value="auto">Automático</option>
              <option value="small">Pequeño</option>
              <option value="medium">Mediano</option>
              <option value="large">Grande</option>
            </Select>
          </SettingItem>
        </SettingSection>

        {/* Biblias */}
        <SettingSection icon={<TypeIcon />} title="Biblias">
          <SettingItem 
            label="Versión predeterminada" 
            description="Biblia que se abre por defecto"
          >
            <Select
              value={settings.defaultVersion}
              onChange={(e) => updateSetting('defaultVersion', e.target.value)}
              className="w-44"
            >
              <option value="rv1960">Reina Valera 1960</option>
              <option value="nvi">Nueva Versión Internacional</option>
              <option value="kjv">King James Version</option>
            </Select>
          </SettingItem>

          <SettingItem 
            label="Mostrar números de versículo" 
            description="Incluir numeración en proyección"
          >
            <Toggle
              checked={settings.showVerseNumbers}
              onChange={(val) => updateSetting('showVerseNumbers', val)}
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
              checked={settings.autoBackup}
              onChange={(val) => updateSetting('autoBackup', val)}
            />
          </SettingItem>

          <SettingItem 
            label="Frecuencia de respaldo" 
            description="Cada cuánto hacer backup"
          >
            <Select
              value={settings.backupFrequency}
              onChange={(e) => updateSetting('backupFrequency', e.target.value)}
              className="w-36"
              disabled={!settings.autoBackup}
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
              >
                Exportar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleImportData}
              >
                Importar
              </Button>
            </div>
          </SettingItem>
        </SettingSection>

        {/* General */}
        <SettingSection icon={<GlobeIcon />} title="General">
          <SettingItem 
            label="Idioma" 
            description="Idioma de la interfaz"
          >
            <Select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-36"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </Select>
          </SettingItem>

          <SettingItem 
            label="Buscar actualizaciones" 
            description="Notificar cuando haya nueva versión"
          >
            <Toggle
              checked={settings.checkUpdates}
              onChange={(val) => updateSetting('checkUpdates', val)}
            />
          </SettingItem>

          <SettingItem 
            label="Iniciar con el sistema" 
            description="Abrir Open Screen al encender el equipo"
          >
            <Toggle
              checked={settings.startOnLogin}
              onChange={(val) => updateSetting('startOnLogin', val)}
            />
          </SettingItem>
        </SettingSection>

        {/* Acerca de */}
        <SettingSection icon={<InfoIcon />} title="Acerca de">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Versión</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">1.0.0</span>
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