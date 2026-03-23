import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useLibrary } from '../../hooks/useLibrary.js'
import { Button, Textarea, Select, SectionLabel, Card } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

const BG_OPTIONS = [
  { value: 'dark',  label: 'Fondo oscuro' },
  { value: 'red',   label: 'Fondo rojo'   },
  { value: 'black', label: 'Negro puro'   },
]

export const BG_STYLES = {
  dark:  'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)',
  red:   'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)',
  black: '#000000',
}

export function SlideEditor() {
  const { liveBg, setLiveBg, project, createItem } = useApp()
  const { activeItem } = useLibrary()

  const [text, setText] = useState('')

  // Cuando se selecciona un ítem de la biblioteca, carga su contenido
  useEffect(() => {
    if (activeItem) setText(activeItem.content)
  }, [activeItem])

  const handleProject = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    project(trimmed, liveBg)
  }

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const title = trimmed.split('\n')[0].substring(0, 30)
    await createItem({ title, content: trimmed, type: 'text' })
  }

  const previewStyle = {
    background: BG_STYLES[liveBg],
  }

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* Preview 16:9 */}
      <div className="slide-canvas w-full max-w-2xl mx-auto animate-fade-up">
        <div className="absolute inset-0 transition-all duration-500" style={previewStyle} />
        <span className="absolute top-2.5 left-3 font-mono text-[10px] text-white/20 tracking-wider select-none">
          PREVIEW
        </span>
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p
            className={cn(
              'font-bold text-center leading-snug whitespace-pre-wrap transition-all',
              text.trim() ? 'text-white' : 'text-white/20',
            )}
            style={{
              fontSize: 'clamp(13px, 3vw, 30px)',
              textShadow: '0 2px 24px rgba(0,0,0,.8)',
            }}
          >
            {text.trim() || 'El texto aparecerá aquí'}
          </p>
        </div>
      </div>

      {/* Editor */}
      <Card className="p-4 animate-fade-up-2">
        <SectionLabel className="mb-2.5">Editor</SectionLabel>
        <Textarea
          rows={3}
          placeholder={'Escribe el texto a proyectar…\nPuedes usar múltiples líneas.'}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleSave}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Guardar en biblioteca
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Select
              value={liveBg}
              onChange={e => setLiveBg(e.target.value)}
            >
              {BG_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Button size="lg" onClick={handleProject} disabled={!text.trim()}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Proyectar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
