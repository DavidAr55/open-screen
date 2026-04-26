import { useState, useEffect, useRef, useCallback } from 'react'

const BG_MAP = {
  dark:  'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)',
  red:   'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)',
  black: '#000000',
}

function calcFontSize(text) {
  if (!text) return 72
  const lines    = text.split('\n').length
  const maxChars = Math.max(...text.split('\n').map(l => l.length))
  if (lines >= 10) return 28
  if (lines >= 8)  return 32
  if (lines >= 6)  return 38
  if (lines >= 5)  return 44
  if (lines >= 4)  return 52
  if (lines >= 3)  return 58
  if (maxChars >= 50) return 42
  if (maxChars >= 40) return 52
  if (maxChars >= 30) return 62
  return 72
}

export default function ProjectionApp() {
  const [text,        setText]        = useState('')
  const [subtext,     setSubtext]     = useState('')
  const [textVisible, setTextVisible] = useState(false)
  const [fontSize,    setFontSize]    = useState(72)
  const [activeBg,    setActiveBg]    = useState({ type: 'gradient', value: BG_MAP.dark })
  const [slideImg,    setSlideImg]    = useState(null)
  const [slideVisible,setSlideVisible]= useState(false)
  const [slideInfo,   setSlideInfo]   = useState(null)

  const fadeTimer = useRef(null)
  const frozenRef = useRef(false)
  const videoRef  = useRef(null)

  const applyBg = useCallback((bg) => {
    if (!bg) return
    if (typeof bg === 'string') {
      setActiveBg({ type: bg.startsWith('#') || bg.includes('(') ? 'css' : 'preset', value: BG_MAP[bg] ?? bg })
    } else {
      setActiveBg(bg)
    }
  }, [])

  const showText = useCallback((newText, newSubtext, rawBg) => {
    setSlideVisible(false)
    setTextVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(null); setSlideInfo(null)
      setText(newText ?? '')
      setSubtext(newSubtext ?? '')
      setFontSize(calcFontSize(newText ?? ''))
      // Solo cambiar el fondo si viene uno nuevo en el payload
      // (si rawBg es undefined/null, mantener el fondo actual)
      if (rawBg !== undefined && rawBg !== null) applyBg(rawBg)
      if (newText) setTextVisible(true)
    }, 220)
  }, [applyBg])

  const showSlide = useCallback((payload) => {
    setTextVisible(false)
    setSlideVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(payload.dataUrl)
      setSlideInfo({ current: payload.slideNumber, total: payload.totalSlides, name: payload.presentationName })
      setSlideVisible(true)
    }, 150)
  }, [])

  useEffect(() => {
    window.api?.onReceive(payload => {
      if (frozenRef.current) return
      const raw    = payload.text ?? ''
      const sepIdx = raw.lastIndexOf('\n\n—')
      const main   = sepIdx !== -1 ? raw.substring(0, sepIdx).trim() : raw
      const sub    = sepIdx !== -1 ? raw.substring(sepIdx + 2).trim() : ''
      showText(main, sub, payload.bg)
    })
    window.api?.onClear(() => {
      setTextVisible(false); setSlideVisible(false)
      clearTimeout(fadeTimer.current)
      fadeTimer.current = setTimeout(() => {
        setText(''); setSubtext(''); setSlideImg(null); setSlideInfo(null)
      }, 220)
    })
    window.api?.onFreeze(({ frozen: f }) => { frozenRef.current = f })
    window.api?.onSlide(payload => {
      if (frozenRef.current) return
      showSlide(payload)
    })
    window.api?.onSetBg(bg => { applyBg(bg) })

    return () => { clearTimeout(fadeTimer.current); window.api?.removeAllListeners() }
  }, [showText, showSlide, applyBg])

  const subFontSize = Math.max(14, Math.round(fontSize * 0.28))
  const bgCss = (activeBg.type === 'color' || activeBg.type === 'gradient' || activeBg.type === 'css' || activeBg.type === 'preset')
    ? activeBg.value
    : '#000'
  const isMedia = activeBg.type === 'image' || activeBg.type === 'gif' || activeBg.type === 'video'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* Fondo sólido / gradiente */}
      {!isMedia && !slideImg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: bgCss,
          transition: 'background 0.5s ease',
        }} />
      )}

      {/* Fondo imagen / GIF — usa base64 thumbnail si está disponible, sino bg:// URL */}
      {(activeBg.type === 'image' || activeBg.type === 'gif') && !slideImg && (
        <>
          <img src={activeBg.thumbnail || activeBg.value} alt=""
            style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.38)' }} />
        </>
      )}

      {/* Fondo video — siempre usa la URL del protocolo bg:// */}
      {activeBg.type === 'video' && !slideImg && (
        <>
          {/* key={activeBg.value} fuerza re-montaje del elemento cuando cambia el video */}
          <video
            key={activeBg.value}
            ref={videoRef}
            src={activeBg.value}
            loop
            muted
            autoPlay
            playsInline
            onCanPlay={e => e.target.play().catch(() => {})}
            onError={e => console.warn('[Video] error:', e.target.error?.message, 'src:', e.target.src)}
            style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.4)' }} />
        </>
      )}

      {/* Slide de presentación */}
      {slideImg && (
        <img src={slideImg} alt=""
          style={{
            position: 'fixed', inset: 0, zIndex: 5,
            width: '100%', height: '100%', objectFit: 'contain', background: '#000',
            opacity: slideVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }} />
      )}

      {/* Texto */}
      {!slideImg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '5vh 8vw', gap: '2vh', overflow: 'hidden',
        }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: `${fontSize}px`, fontWeight: 800, color: '#ffffff',
            textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', letterSpacing: '-0.02em',
            textShadow: '0 2px 48px rgba(0,0,0,.9), 0 1px 8px rgba(0,0,0,.8)',
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity 0.45s ease, transform 0.45s ease',
            maxWidth: '100%', overflowWrap: 'break-word',
          }}>
            {text}
          </p>
          {subtext && (
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: `${subFontSize}px`, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', textAlign: 'center',
              textShadow: '0 1px 8px rgba(0,0,0,.8)',
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s 0.1s ease, transform 0.5s 0.1s ease',
              maxWidth: '100%',
            }}>
              {subtext}
            </p>
          )}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 18, right: 22, zIndex: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        OPEN SCREEN
      </div>
    </div>
  )
}