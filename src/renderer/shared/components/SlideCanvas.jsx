import { cn } from '@shared/utils/cn.js'
import { DEFAULT_BG } from '@shared/constants/defaultBackground.js'
import {
  buildFontFamily,
  resolveFontSize,
  splitProjectionText,
  previewFontSize,
} from '@shared/utils/font.js'

/**
 * Lienzo de preview 16:9 compartido — unifica las superficies copy-pasteadas
 * de SlideEditor/LivePanel/Scripture/Songs/Settings.
 *
 * IMPORTANTE: la clase .slide-canvas aporta `container-type: size` y
 * `aspect-ratio: 16/9`; el texto usa unidades cqw (previewFontSize), así que
 * no debe envolverse en contenedores intermedios con container-type propio.
 *
 * Props:
 *   bg           — { type, value, thumbnail? } | null (fallback: DEFAULT_BG)
 *   text         — texto a proyectar (se separa main/sub con '\n\n—')
 *   fontFamily   — nombre de fuente de proyección
 *   fontSizeMode — 'auto' | número en px
 *   label        — etiqueta mono en la esquina (ej. "PREVIEW")
 *   live         — estiliza la etiqueta en rojo con punto parpadeante
 *   empty        — texto tenue cuando no hay contenido
 *   video        — si bg.type === 'video', reproduce el video real en loop
 *   className    — clases extra del contenedor
 *   children     — overlays adicionales (watermark, badges, etc.)
 */
export function SlideCanvas({
  bg,
  text = '',
  fontFamily,
  fontSizeMode,
  label,
  live = false,
  empty = '— vacío —',
  video = false,
  className,
  style,
  children,
}) {
  const effBg = bg ?? DEFAULT_BG
  const { main, sub } = splitProjectionText(text)
  const hasText = !!main
  const mainPx = resolveFontSize(main, fontSizeMode)
  const subPx  = Math.max(14, Math.round(mainPx * 0.28))

  const isMediaBg = effBg.type === 'image' || effBg.type === 'gif' || effBg.type === 'video'
  const showVideo = video && effBg.type === 'video' && effBg.value

  const bgStyle = (() => {
    if (effBg.type === 'color' || effBg.type === 'gradient' || effBg.type === 'css') {
      return { background: effBg.value }
    }
    if (effBg.type === 'image' || effBg.type === 'gif') {
      const src = effBg.value || effBg.thumbnail
      if (src) return { backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    if (effBg.type === 'video' && !showVideo && effBg.thumbnail) {
      return { backgroundImage: `url(${effBg.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    return { background: '#111' }
  })()

  return (
    <div className={cn('slide-canvas bg-black', className)} style={style}>
      {/* Capa de fondo */}
      <div className="absolute inset-0 transition-all duration-500" style={bgStyle} />
      {showVideo && (
        <video
          src={effBg.value}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline
        />
      )}
      {/* Scrim para legibilidad sobre media — mismos valores que la proyección */}
      {isMediaBg && (
        <div
          className="absolute inset-0"
          style={{ background: effBg.type === 'video' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.38)' }}
        />
      )}

      {/* Texto — mismos márgenes proporcionales que la proyección real (5vh 8vw) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2cqh] px-[8cqw] py-[5cqh] overflow-hidden">
        <p
          className={cn(
            'text-center whitespace-pre-wrap transition-colors',
            hasText ? 'text-white' : 'text-white/20',
          )}
          style={{
            fontFamily: buildFontFamily(fontFamily),
            fontSize: hasText ? previewFontSize(mainPx) : 'clamp(9px, 3.2cqw, 30px)',
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 24px rgba(0,0,0,.8)',
          }}
        >
          {hasText ? main : empty}
        </p>
        {hasText && sub && (
          <p
            className="text-center whitespace-pre-wrap text-white/50"
            style={{
              fontFamily: buildFontFamily(fontFamily),
              fontSize: previewFontSize(subPx),
              fontWeight: 600,
            }}
          >
            {sub}
          </p>
        )}
      </div>

      {/* Etiqueta de esquina */}
      {label && (
        <span
          className={cn(
            'absolute top-2 left-2.5 inline-flex items-center gap-1.5',
            'font-mono text-[10px] tracking-[1.2px] uppercase select-none',
            live ? 'text-live-500 font-semibold' : 'text-white/25',
          )}
        >
          {live && <span className="w-1.5 h-1.5 rounded-full bg-live-500 animate-blink" />}
          {label}
        </span>
      )}

      {children}
    </div>
  )
}
