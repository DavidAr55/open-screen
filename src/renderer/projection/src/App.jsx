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
  const [bg,          setBg]          = useState(BG_MAP.dark)
  const [textVisible, setTextVisible] = useState(false)
  const [fontSize,    setFontSize]    = useState(72)
  const [slideImg,    setSlideImg]    = useState(null)
  const [slideVisible,setSlideVisible]= useState(false)
  const [slideInfo,   setSlideInfo]   = useState(null)

  const fadeTimer = useRef(null)
  const frozenRef = useRef(false)

  const showText = useCallback((newText, newSubtext, newBg) => {
    setSlideVisible(false)
    setTextVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(null)
      setText(newText ?? '')
      setSubtext(newSubtext ?? '')
      setBg(newBg ?? BG_MAP.dark)
      setFontSize(calcFontSize(newText ?? ''))
      if (newText) setTextVisible(true)
    }, 220)
  }, [])

  const showSlide = useCallback((payload) => {
    setTextVisible(false)
    setSlideVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(payload.dataUrl)
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
      const bgStyle = typeof payload.bg === 'string' && payload.bg.startsWith('#')
        ? payload.bg : BG_MAP[payload.bg] ?? BG_MAP.dark
      showText(main, sub, bgStyle)
    })

    window.api?.onClear(() => {
      setTextVisible(false)
      setSlideVisible(false)
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

    return () => {
      clearTimeout(fadeTimer.current)
      window.api?.removeAllListeners()
    }
  }, [showText, showSlide])

  const subFontSize = Math.max(14, Math.round(fontSize * 0.28))

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* Imagen de slide (presentaciones) */}
      {slideImg && (
        <img src={slideImg} alt=""
          style={{
            position: 'fixed', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            background: '#000',
            opacity: slideVisible ? 1 : 0,
            transition: 'opacity 0.25s ease',
            zIndex: 2,
          }}
        />
      )}

      {/* Texto */}
      {!slideImg && (
        <>
          <div style={{
            position: 'fixed', inset: 0,
            background: bg,
            opacity: textVisible ? 1 : 0,
            transition: 'opacity 0.6s ease, background 0.4s ease',
            zIndex: 1,
          }} />
          <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '5vh 8vw', gap: '2vh', zIndex: 1, overflow: 'hidden',
          }}>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: `${fontSize}px`, fontWeight: 800, color: '#ffffff',
              textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', letterSpacing: '-0.02em',
              textShadow: '0 2px 48px rgba(0,0,0,.8)',
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
                color: 'rgba(255,255,255,0.4)', textAlign: 'center',
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.5s 0.1s ease, transform 0.5s 0.1s ease',
                maxWidth: '100%',
              }}>
                {subtext}
              </p>
            )}
          </div>
        </>
      )}

      {/* Marca de agua */}
      <div style={{
        position: 'fixed', bottom: 18, right: 22,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none', userSelect: 'none', zIndex: 10,
      }}>
        OPEN SCREEN
      </div>
    </div>
  )
}