import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useLibrary } from '../../hooks/useLibrary.js'
import { Button, Textarea, FieldLabel, Card, LiveBadge } from '@shared/components/ui/index.jsx'
import { SlideCanvas } from '@shared/components/SlideCanvas.jsx'
import { watermarkPreviewStyle } from '@shared/constants/watermark.js'

export function SlideEditor() {
  const { project, createItem, activeBg, projectionFontFamily, projFontSize, watermark, isLive, liveText } = useApp()
  const { activeItem } = useLibrary()

  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  // Cuando se selecciona un ítem de la biblioteca, carga su contenido
  useEffect(() => {
    if (activeItem) setText(activeItem.content)
  }, [activeItem])

  const handleProject = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    project(trimmed)
  }

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const title = trimmed.split('\n')[0].substring(0, 30)
    await createItem({ title, content: trimmed, type: 'text' })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const watermarkOverlay = watermark?.enabled && watermark.image && (
    <img src={watermark.image} alt="" className="absolute pointer-events-none select-none"
      style={watermarkPreviewStyle(watermark)} />
  )

  const lines = text.trim() ? text.trim().split('\n').length : 0

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* Preview (borrador) + En vivo (lo que se está proyectando) lado a lado */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-4xl mx-auto animate-fade-up">
        <SlideCanvas
          bg={activeBg}
          text={text.trim()}
          fontFamily={projectionFontFamily}
          fontSizeMode={projFontSize}
          label="Preview"
          empty="El texto aparecerá aquí"
          video
        >
          {watermarkOverlay}
        </SlideCanvas>

        <SlideCanvas
          bg={activeBg}
          text={isLive ? liveText : ''}
          fontFamily={projectionFontFamily}
          fontSizeMode={projFontSize}
          label="Salida"
          live={isLive}
          empty="— vacío —"
          video
        >
          <div className="absolute top-2 right-2.5">
            <LiveBadge live={isLive} />
          </div>
          {watermarkOverlay}
        </SlideCanvas>
      </div>

      {/* Editor */}
      <Card className="p-4 animate-fade-up-2">
        <div className="flex items-center justify-between mb-2.5">
          <FieldLabel>Editor</FieldLabel>
          <span className="font-mono text-[10px] text-ink-4 tabular-nums select-none">
            {text.trim().length} car · {lines} lín
          </span>
        </div>
        <Textarea
          rows={3}
          placeholder={'Escribe el texto a proyectar…\nPuedes usar múltiples líneas.'}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={!text.trim()}>
            {saved ? (
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            )}
            {saved ? '¡Guardado!' : 'Guardar en biblioteca'}
          </Button>

          <div className="ml-auto flex items-center gap-2">
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
