import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Project } from '../shared/types'
import './projectVideo.css'

type NativeFullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitExitFullscreen?: () => void; webkitDisplayingFullscreen?: boolean }
function clock(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
function VideoIcon({name}: {name: 'play' | 'pause' | 'sound' | 'muted' | 'expand' | 'collapse'}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'play' ? <path d="m7 5 10 7-10 7Z" fill="currentColor" stroke="none"/> : name === 'pause' ? <path d="M8 5v14M16 5v14" strokeWidth="3"/> : name === 'expand' ? <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/> : name === 'collapse' ? <path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/> : <><path d="M11 4 6 8H3v8h3l5 4Z"/>{name === 'muted' ? <path d="m16 9 6 6m0-6-6 6"/> : <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>}</>}
  </svg>
}
export function ProjectVideo({video}: {video: NonNullable<Project['video']>}) {
  const element = useRef<HTMLVideoElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointer = useRef<{x: number; y: number} | null>(null)
  const scrubbing = useRef(false)
  const nativeFullscreen = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [active, setActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [failed, setFailed] = useState(false)
  const [notice, setNotice] = useState('')
  const [ratio, setRatio] = useState(16 / 9)
  const reveal = useCallback(() => {
    setActive(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (!scrubbing.current) hideTimer.current = setTimeout(() => setActive(false), 2500)
  }, [])
  useEffect(() => {
    const player = element.current
    let frame = 0
    const change = () => {
      setFullscreen(document.fullscreenElement === wrapper.current || nativeFullscreen.current)
      pointer.current = null
      reveal()
    }
    const beginNative = () => {nativeFullscreen.current = true; change()}
    const endNative = () => {nativeFullscreen.current = false; change()}
    const orientation = window.matchMedia('(orientation: landscape)')
    const rotate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        pointer.current = null
        reveal()
        if (orientation.matches && !player?.paused && !document.fullscreenElement && !nativeFullscreen.current) {
          wrapper.current?.scrollIntoView({block:'center', behavior:'instant'})
        }
      })
    }
    document.addEventListener('fullscreenchange', change)
    player?.addEventListener('webkitbeginfullscreen', beginNative)
    player?.addEventListener('webkitendfullscreen', endNative)
    orientation.addEventListener('change', rotate)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('fullscreenchange', change)
      player?.removeEventListener('webkitbeginfullscreen', beginNative)
      player?.removeEventListener('webkitendfullscreen', endNative)
      orientation.removeEventListener('change', rotate)
    }
  }, [reveal])
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])
  const move = (event: PointerEvent<HTMLDivElement>) => {
    // Ignore synthetic stationary events caused by fullscreen or overlay changes.
    if (pointer.current?.x === event.clientX && pointer.current?.y === event.clientY) return
    pointer.current = {x:event.clientX, y:event.clientY}
    reveal()
  }
  const finishScrub = () => {scrubbing.current = false; reveal()}
  const toggle = async () => {
    const player = element.current
    if (!player || failed) return
    setNotice('')
    if (!player.paused) {player.pause(); return}
    if (player.ended) player.currentTime = 0
    setWaiting(true)
    try {await player.play()} catch {setWaiting(false); setNotice('Riproduzione non disponibile. Riprova.')}
  }
  const seek = (value: number) => {
    if (element.current && duration > 0) {
      element.current.currentTime = Math.max(0, Math.min(duration, value))
      setTime(element.current.currentTime)
      reveal()
    }
  }
  const expand = async () => {
    try {
      if ((element.current as NativeFullscreenVideo | null)?.webkitDisplayingFullscreen) (element.current as NativeFullscreenVideo).webkitExitFullscreen?.()
      else if (document.fullscreenElement === wrapper.current) await document.exitFullscreen()
      else if (wrapper.current?.requestFullscreen) await wrapper.current.requestFullscreen()
      else (element.current as NativeFullscreenVideo | null)?.webkitEnterFullscreen?.()
    } catch {
      const player = element.current as NativeFullscreenVideo | null
      if (player?.webkitEnterFullscreen) player.webkitEnterFullscreen()
      else setNotice('Schermo intero non disponibile in questo browser.')
    }
  }
  return <div className="project-video-wrap">
    <div ref={wrapper} className={`film-player${ratio < 1 ? ' is-portrait' : ''}${playing ? ' is-playing' : ''}${active ? ' controls-visible' : ''}`} style={{'--video-ratio':ratio} as CSSProperties} role="region" aria-label={video.alt} tabIndex={0}
      onPointerEnter={move} onPointerMove={move} onPointerDown={reveal}
      onPointerLeave={event => {
        if (event.pointerType === 'touch' || scrubbing.current) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) return
        pointer.current = null
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setActive(false)
      }} onFocusCapture={reveal}
      onKeyDown={event => {
        reveal()
        if (event.target !== event.currentTarget) return
        if (event.key === ' ' || event.key.toLowerCase() === 'k') {event.preventDefault(); void toggle()}
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault(); seek(time + (event.key === 'ArrowRight' ? 5 : -5))}
      }}>
      <video ref={element} playsInline preload="metadata" src={video.src} poster={video.thumbnail} aria-label={video.alt}
        onLoadedMetadata={event => {const player=event.currentTarget; setDuration(Number.isFinite(player.duration) ? player.duration : 0); if (player.videoWidth && player.videoHeight) setRatio(player.videoWidth / player.videoHeight)}}
        onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={event => {if (!scrubbing.current) setTime(event.currentTarget.currentTime)}}
        onPlay={() => setPlaying(true)} onPlaying={() => setWaiting(false)} onWaiting={() => setWaiting(true)}
        onPause={() => {setPlaying(false); setWaiting(false)}} onEnded={() => {setPlaying(false); setWaiting(false)}}
        onVolumeChange={event => setMuted(event.currentTarget.muted || event.currentTarget.volume === 0)}
        onError={() => {setFailed(true); setWaiting(false); setPlaying(false)}}/>
      {!failed && <button type="button" className="film-stage-toggle" onClick={() => void toggle()} aria-label={playing ? 'Metti in pausa il video' : 'Riproduci il video'}><span className="film-play-disc"><VideoIcon name="play"/></span></button>}
      {waiting && <span className="film-buffering" role="status" aria-label="Caricamento video"/>}
      {failed ? <div className="film-error" role="alert"><p>Impossibile caricare il video.</p><button type="button" onClick={() => {setFailed(false); setNotice(''); element.current?.load()}}>Riprova</button></div> : <div className="film-controls" aria-label="Controlli video">
        <button type="button" className="film-toggle" onClick={() => void toggle()} aria-label={playing ? 'Pausa' : 'Riproduci'}><VideoIcon name={playing ? 'pause' : 'play'}/></button>
        <input className="film-progress" type="range" dir="ltr" onPointerDown={() => {scrubbing.current = true; reveal()}} onPointerUp={finishScrub} onPointerCancel={finishScrub} onBlur={finishScrub} min="0" max={duration || 1} step="0.1" value={time} disabled={!duration} onChange={event => seek(Number(event.target.value))} aria-label="Avanzamento video" aria-valuetext={`${clock(time)} di ${clock(duration)}`} style={{'--progress':`${duration ? time / duration * 100 : 0}%`} as CSSProperties}/>
        <span className="film-time">{clock(time)} <span>/ {clock(duration)}</span></span>
        <button type="button" onClick={() => {const player=element.current;if (player) {player.muted=!player.muted; if (!player.muted && player.volume===0) player.volume=1}}} aria-label={muted ? 'Attiva audio' : 'Disattiva audio'} aria-pressed={muted}><VideoIcon name={muted ? 'muted' : 'sound'}/></button>
        <button type="button" onClick={() => void expand()} aria-label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'} aria-pressed={fullscreen}><VideoIcon name={fullscreen ? 'collapse' : 'expand'}/></button>
      </div>}
      {notice && <p className="film-notice" role="status">{notice}</p>}
    </div>
  </div>
}
