import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_BG } from '@shared/constants/defaultBackground.js'
import { buildFontFamily, resolveFontSize, splitProjectionText } from '@shared/utils/font.js'
import { DEFAULT_WATERMARK, WATERMARK_OPACITY_MAP, watermarkCornerStyle } from '@shared/constants/watermark.js'

export default function ProjectionApp() {
  const [text,        setText]        = useState('')
  const [subtext,     setSubtext]     = useState('')
  const [textVisible, setTextVisible] = useState(false)
  const [fontSize,    setFontSize]    = useState(72)
  const [fontFamily,  setFontFamily]  = useState(buildFontFamily())
  const [activeBg,    setActiveBg]    = useState(DEFAULT_BG)
  const [slideImg,    setSlideImg]    = useState(null)
  const [slideVisible,setSlideVisible]= useState(false)
  const [slideInfo,   setSlideInfo]   = useState(null)
  const [watermark,   setWatermark]   = useState(DEFAULT_WATERMARK)
  const [media,        setMedia]        = useState(null) // { id, type, url, name }
  const [mediaVisible, setMediaVisible] = useState(false)
  const [screenMode,   setScreenMode]   = useState('normal') // 'normal' | 'black' | 'logo'

  const fadeTimer = useRef(null)
  const frozenRef = useRef(false)
  const videoRef  = useRef(null)
  const mediaVideoRef = useRef(null)
  const textRef   = useRef('')

  useEffect(() => { textRef.current = text }, [text])

  const applyBg = useCallback((bg) => {
    if (bg) setActiveBg(bg)
  }, [])

  const showText = useCallback((newText, newSubtext, rawBg, fontSizeMode, fontFamilyName) => {
    setSlideVisible(false)
    setMediaVisible(false)
    setTextVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(null); setSlideInfo(null)
      setMedia(null)
      setText(newText ?? '')
      setSubtext(newSubtext ?? '')
      setFontSize(resolveFontSize(newText ?? '', fontSizeMode))
      setFontFamily(buildFontFamily(fontFamilyName))
      // Solo cambiar el fondo si viene uno nuevo en el payload
      // (si rawBg es undefined/null, mantener el fondo actual)
      if (rawBg !== undefined && rawBg !== null) applyBg(rawBg)
      if (newText) setTextVisible(true)
    }, 220)
  }, [applyBg])

  const showSlide = useCallback((payload) => {
    setTextVisible(false)
    setSlideVisible(false)
    setMediaVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setMedia(null)
      setSlideImg(payload.dataUrl)
      setSlideInfo({ current: payload.slideNumber, total: payload.totalSlides, name: payload.presentationName })
      setSlideVisible(true)
    }, 150)
  }, [])

  const showMedia = useCallback((payload) => {
    setTextVisible(false)
    setSlideVisible(false)
    setMediaVisible(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => {
      setSlideImg(null); setSlideInfo(null)
      setMedia(payload)
      setMediaVisible(true)
    }, 150)
  }, [])

  useEffect(() => {
    window.api?.onReceive(payload => {
      if (frozenRef.current) return
      const { main, sub } = splitProjectionText(payload.text)
      showText(main, sub, payload.bg, payload.fontSize, payload.fontFamily)
      if (payload.watermark) setWatermark(payload.watermark)
    })
    window.api?.onClear(() => {
      setTextVisible(false); setSlideVisible(false); setMediaVisible(false)
      clearTimeout(fadeTimer.current)
      fadeTimer.current = setTimeout(() => {
        setText(''); setSubtext(''); setSlideImg(null); setSlideInfo(null); setMedia(null)
      }, 220)
    })
    window.api?.onFreeze(({ frozen: f }) => { frozenRef.current = f })
    window.api?.onSlide(payload => {
      if (frozenRef.current) return
      showSlide(payload)
    })
    window.api?.onMedia(payload => {
      if (frozenRef.current) return
      showMedia(payload)
    })
    window.api?.onMediaControl(payload => {
      const v = mediaVideoRef.current
      if (!v || !payload) return
      if (payload.action === 'play')   v.play().catch(() => {})
      if (payload.action === 'pause')  v.pause()
      if (payload.action === 'seek')   v.currentTime = payload.value
      if (payload.action === 'volume') v.volume = payload.value
      if (payload.action === 'muted')  v.muted = payload.value
    })
    window.api?.onSetBg(bg => { applyBg(bg) })
    window.api?.onSetFont(name => { setFontFamily(buildFontFamily(name)) })
    window.api?.onSetFontSize(mode => { setFontSize(resolveFontSize(textRef.current, mode)) })
    window.api?.onSetWatermark(wm => { setWatermark(wm) })
    window.api?.onSetScreen(mode => { setScreenMode(mode ?? 'normal') })

    return () => { clearTimeout(fadeTimer.current); window.api?.removeAllListeners() }
  }, [showText, showSlide, showMedia, applyBg])

  const subFontSize = Math.max(14, Math.round(fontSize * 0.28))
  const bgCss = (activeBg.type === 'color' || activeBg.type === 'gradient' || activeBg.type === 'css' || activeBg.type === 'preset')
    ? activeBg.value
    : '#000'
  const isMedia = activeBg.type === 'image' || activeBg.type === 'gif' || activeBg.type === 'video'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* Fondo sólido / gradiente */}
      {!isMedia && !slideImg && !media && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: bgCss,
          transition: 'background 0.5s ease',
        }} />
      )}

      {/* Fondo imagen / GIF — usa base64 thumbnail si está disponible, sino bg:// URL */}
      {(activeBg.type === 'image' || activeBg.type === 'gif') && !slideImg && !media && (
        <>
          <img src={activeBg.thumbnail || activeBg.value} alt=""
            style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.38)' }} />
        </>
      )}

      {/* Fondo video — siempre usa la URL del protocolo bg:// */}
      {activeBg.type === 'video' && !slideImg && !media && (
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

      {/* Multimedia (imagen / GIF / video) proyectada directamente desde la biblioteca */}
      {media && (media.type === 'image' || media.type === 'gif') && (
        <img src={media.url} alt=""
          style={{
            position: 'fixed', inset: 0, zIndex: 5,
            width: '100%', height: '100%', objectFit: 'contain', background: '#000',
            opacity: mediaVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }} />
      )}
      {media && media.type === 'video' && (
        <video
          key={media.url}
          ref={mediaVideoRef}
          src={media.url}
          autoPlay
          playsInline
          controls={false}
          onLoadedMetadata={e => {
            if (media.startAt) e.target.currentTime = media.startAt
            if (media.paused) e.target.pause()
          }}
          onError={e => console.warn('[Media] error:', e.target.error?.message, 'src:', e.target.src)}
          style={{
            position: 'fixed', inset: 0, zIndex: 5,
            width: '100%', height: '100%', objectFit: 'contain', background: '#000',
            opacity: mediaVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {/* Texto */}
      {!slideImg && !media && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '5vh 8vw', gap: '2vh', overflow: 'hidden',
        }}>
          <p style={{
            fontFamily,
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
              fontFamily,
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

      {/* Marca de agua del usuario (logo con opacidad en una esquina) */}
      {watermark.enabled && watermark.image && (
        <img
          src={watermark.image}
          alt=""
          style={{
            position: 'fixed', zIndex: 9, maxWidth: '14%', maxHeight: '14%',
            opacity: WATERMARK_OPACITY_MAP[watermark.opacity] ?? WATERMARK_OPACITY_MAP.medium,
            pointerEvents: 'none', userSelect: 'none',
            ...watermarkCornerStyle(watermark),
          }}
        />
      )}

      {/* Overlay del transport: pantalla en negro o logo (por encima de todo) */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 20, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: screenMode !== 'normal' ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.35s ease',
      }}>
        {screenMode === 'logo' && (
          watermark.image ? (
            <img src={watermark.image} alt=""
              style={{ maxWidth: '28%', maxHeight: '28%', objectFit: 'contain' }} />
          ) : (
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 26, fontWeight: 800, letterSpacing: '6px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            }}>
              Open Screen
            </span>
          )
        )}
      </div>

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