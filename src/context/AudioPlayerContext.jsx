import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { incrementSoundPlayCount } from '../services/soundService'
import { apiPatch } from '../services/api'

const AudioPlayerContext = createContext(null)

function canPlay(sound) {
  return typeof sound?.fileUrl === 'string' && sound.fileUrl.trim().length > 0
}

function isVideo(sound) {
  if (!canPlay(sound)) return false
  const url = sound.fileUrl.toLowerCase()
  return url.endsWith('.mp4') || url.includes('.mp4?')
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null)
  const pendingSeekRef = useRef(null)
  const durationProbeRef = useRef(false)
  const durationProbeRestoreRef = useRef(0)
  const currentUrlRef = useRef('')
  const decodedDurationRef = useRef(new Map())
  const decodeInflightRef = useRef(new Map())

  const [currentSound, setCurrentSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (!isPlaying) return

    const id = setInterval(() => {
      setCurrentTime(a.currentTime || 0)
    }, 250)

    return () => clearInterval(id)
  }, [isPlaying])

  async function decodeDurationForUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return 0
    const key = url.trim()

    if (decodedDurationRef.current.has(key)) {
      return decodedDurationRef.current.get(key)
    }

    if (decodeInflightRef.current.has(key)) {
      return decodeInflightRef.current.get(key)
    }

    const promise = (async () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return 0

        const res = await fetch(key)
        if (!res.ok) return 0

        const buf = await res.arrayBuffer()
        const ctx = new Ctx()
        try {
          const decoded = await ctx.decodeAudioData(buf)
          const d = decoded?.duration
          const safe = Number.isFinite(d) ? d : 0
          if (safe > 0) {
            decodedDurationRef.current.set(key, safe)
          }
          return safe
        } finally {
          try {
            await ctx.close()
          } catch {
            // ignore
          }
        }
      } catch {
        return 0
      } finally {
        decodeInflightRef.current.delete(key)
      }
    })()

    decodeInflightRef.current.set(key, promise)
    return promise
  }

  function ensureDurationFallback(url) {
    if (typeof url !== 'string' || !url.trim()) return
    const a = audioRef.current
    if (!a) return

    const elementDuration = a.duration
    if (Number.isFinite(elementDuration) && elementDuration > 0) return

    decodeDurationForUrl(url).then((d) => {
      if (!Number.isFinite(d) || d <= 0) return
      if (currentUrlRef.current !== url) return
      setDuration(d)

      if (currentSound?.id != null && String(currentSound.fileUrl) === String(url)) {
        apiPatch(`/sounds/${currentSound.id}`, { durationSeconds: d }).catch(() => null)
      }
    })
  }

  async function bumpPlayCount(sound) {
    if (!sound || sound.id == null) return
    const nextCount = (Number.isFinite(sound.playCount) ? sound.playCount : 0) + 1
    try {
      const updated = await incrementSoundPlayCount(sound.id, nextCount)
      if (updated && currentSound?.id != null && String(updated.id) === String(currentSound.id)) {
        setCurrentSound((prev) => (prev ? { ...prev, playCount: updated.playCount } : prev))
      }
    } catch {
      return
    }
  }

  useEffect(() => {
    if (audioRef.current) return

    const a = new Audio()
    audioRef.current = a
    a.preload = 'metadata'
    a.volume = volume

    const onTimeUpdate = () => {
      setCurrentTime(a.currentTime || 0)
    }

    const maybeFinalizeProbedDuration = () => {
      if (!durationProbeRef.current) return
      const d = a.duration
      if (!Number.isFinite(d) || d <= 0) return
      durationProbeRef.current = false
      setDuration(d)
      try {
        a.currentTime = durationProbeRestoreRef.current
      } catch {
        return
      }
      setCurrentTime(a.currentTime || 0)
    }

    const probeDurationIfNeeded = () => {
      if (durationProbeRef.current) return
      const d = a.duration
      if (Number.isFinite(d) && d > 0) return
      durationProbeRef.current = true
      durationProbeRestoreRef.current = a.currentTime || 0
      try {
        a.currentTime = 1e7
      } catch {
        durationProbeRef.current = false
      }
    }

    const applyPendingSeekIfNeeded = () => {
      const pending = pendingSeekRef.current
      if (pending == null) return
      const d = Number.isFinite(a.duration) ? a.duration : 0
      if (!Number.isFinite(d) || d <= 0) return
      const safe = Math.min(d, Math.max(0, pending))
      try {
        a.currentTime = safe
      } catch {
        return
      }
      pendingSeekRef.current = null
      setCurrentTime(a.currentTime || 0)
    }

    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration)
      } else {
        probeDurationIfNeeded()
        ensureDurationFallback(currentUrlRef.current)
      }
      applyPendingSeekIfNeeded()
      maybeFinalizeProbedDuration()
    }

    const onSeeking = () => {
      setCurrentTime(a.currentTime || 0)
    }

    const onSeeked = () => {
      setCurrentTime(a.currentTime || 0)
    }

    const onCanPlay = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration)
      } else {
        probeDurationIfNeeded()
        ensureDurationFallback(currentUrlRef.current)
      }
      applyPendingSeekIfNeeded()
      maybeFinalizeProbedDuration()
    }

    const onPlay = () => {
      console.log('[AudioPlayer] onPlay event fired')
      setIsPlaying(true)
    }

    const onPause = () => {
      console.log('[AudioPlayer] onPause event fired')
      setIsPlaying(false)
    }

    const onEnded = () => {
      setIsPlaying(false)
      try {
        a.currentTime = 0
      } catch {
        return
      }
      setCurrentTime(0)
    }

    a.addEventListener('timeupdate', onTimeUpdate)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('durationchange', onLoaded)
    a.addEventListener('canplay', onCanPlay)
    a.addEventListener('timeupdate', maybeFinalizeProbedDuration)
    a.addEventListener('seeking', onSeeking)
    a.addEventListener('seeked', onSeeked)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)

    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate)
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('durationchange', onLoaded)
      a.removeEventListener('canplay', onCanPlay)
      a.removeEventListener('timeupdate', maybeFinalizeProbedDuration)
      a.removeEventListener('seeking', onSeeking)
      a.removeEventListener('seeked', onSeeked)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
    }
  }, [volume])

  function setVolume(v) {
    const safe = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
    setVolumeState(safe)
    if (audioRef.current) {
      audioRef.current.volume = safe
    }
  }

  async function play(sound) {
    if (!canPlay(sound)) return
    if (isVideo(sound)) return

    const a = audioRef.current
    if (!a) return

    const nextUrl = sound.fileUrl
    const isSame = currentSound?.id != null && String(currentSound.id) === String(sound.id)

    setCurrentSound(sound)
    if (Number.isFinite(sound?.durationSeconds) && sound.durationSeconds > 0) {
      setDuration(sound.durationSeconds)
    }

    if (!isSame || a.src !== nextUrl) {
      a.pause()
      a.src = nextUrl
      currentUrlRef.current = nextUrl
      setDuration(0)
      durationProbeRef.current = false
      try {
        a.currentTime = 0
      } catch {
        // ignore
      }
      setCurrentTime(0)

      try {
        a.load()
      } catch {
        // ignore
      }

      ensureDurationFallback(nextUrl)
    }

    try {
      await a.play()
      bumpPlayCount(sound)
    } catch {
      setIsPlaying(false)
    }
  }

  async function toggle(sound) {
    if (!canPlay(sound)) return
    if (isVideo(sound)) return

    const a = audioRef.current
    if (!a) return

    const isSame = currentSound?.id != null && String(currentSound.id) === String(sound.id)

    if (!isSame) {
      await play(sound)
      return
    }

    if (a.paused) {
      try {
        await a.play()
        bumpPlayCount(sound)
      } catch {
        setIsPlaying(false)
      }
      return
    }

    a.pause()
  }

  function stop() {
    const a = audioRef.current
    if (!a) return
    a.pause()
    try {
      a.currentTime = 0
    } catch {
      return
    }
    setCurrentTime(0)
    setIsPlaying(false)
  }

  function seek(nextTime) {
    const a = audioRef.current
    if (!a) return
    let safe = Number.isFinite(nextTime) ? Math.max(0, nextTime) : 0
    if (Number.isFinite(duration) && duration > 0) {
      safe = Math.min(duration, safe)
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      pendingSeekRef.current = safe
      return
    }
    try {
      a.currentTime = safe
      setCurrentTime(a.currentTime || 0)
    } catch {
      return
    }
  }

  const value = useMemo(
    () => ({
      currentSound,
      isPlaying,
      currentTime,
      duration,
      volume,
      play,
      toggle,
      stop,
      seek,
      setVolume,
    }),
    [currentSound, currentTime, duration, isPlaying, volume],
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return ctx
}
