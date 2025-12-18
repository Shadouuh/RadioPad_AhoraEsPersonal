import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { FiMusic, FiPause, FiPlay } from 'react-icons/fi'
import ui from '../ui/ui.module.css'
import styles from './soundGrid.module.css'
import { useAudioPlayer } from '../../context/AudioPlayerContext'
import { incrementSoundPlayCount } from '../../services/soundService'

function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function canPlay(sound) {
  return typeof sound?.fileUrl === 'string' && sound.fileUrl.trim().length > 0
}

function isVideo(sound) {
  if (!canPlay(sound)) return false
  const url = sound.fileUrl.toLowerCase()
  return url.endsWith('.mp4') || url.includes('.mp4?')
}

const SoundGrid = forwardRef(function SoundGrid(
  {
    sounds,
    showScope = true,
    emptyText = 'No hay sonidos para mostrar.',
    highlightId,
    variant = 'default',
    canDelete,
    onDelete,
  },
  ref,
) {
  const player = useAudioPlayer()
  const [durations, setDurations] = useState({})

  const minimal = variant === 'minimal'

  useImperativeHandle(
    ref,
    () => ({
      stop() {
        player.stop()
      },
    }),
    [player],
  )

  const soundList = useMemo(() => (Array.isArray(sounds) ? sounds : []), [sounds])

  useEffect(() => {
    let alive = true
    const created = []

    async function loadDuration(sound) {
      if (!canPlay(sound)) return
      if (isVideo(sound)) return
      if (durations[sound.id] != null) return
      
      if (sound.durationSeconds != null && Number.isFinite(sound.durationSeconds)) {
        setDurations((prev) => {
          if (prev[sound.id] != null) return prev
          return { ...prev, [sound.id]: sound.durationSeconds }
        })
        return
      }

      const a = new Audio()
      created.push(a)
      a.preload = 'metadata'
      a.src = sound.fileUrl

      const onLoaded = () => {
        if (!alive) return
        setDurations((prev) => {
          if (prev[sound.id] != null) return prev
          return { ...prev, [sound.id]: a.duration }
        })
      }

      a.addEventListener('loadedmetadata', onLoaded)
      a.addEventListener('error', onLoaded)
    }

    soundList.forEach((s) => {
      loadDuration(s)
    })

    return () => {
      alive = false
      created.forEach((a) => {
        try {
          a.src = ''
        } catch {
          return
        }
      })
    }
  }, [soundList, durations])

  async function toggle(sound) {
    await player.toggle(sound)
  }

  async function onVideoPlay(sound) {
    if (!sound || sound.id == null) return
    const nextCount = (Number.isFinite(sound.playCount) ? sound.playCount : 0) + 1
    try {
      await incrementSoundPlayCount(sound.id, nextCount)
    } catch {
      return
    }
  }

  if (soundList.length === 0) {
    return <div className={ui.muted}>{emptyText}</div>
  }

  return (
    <div className={styles.grid}>
      {soundList.map((s) => {
        const playable = canPlay(s)
        const video = isVideo(s)
        const isCurrent = player.currentSound?.id != null && String(player.currentSound.id) === String(s.id)
        const isPaused = isCurrent && !player.isPlaying
        const shouldAnimate = highlightId != null && String(highlightId) === String(s.id)

        return (
          <div key={s.id} className={`${styles.card} ${shouldAnimate ? styles.enter : ''}`}>
            <div className={styles.top}>
              <div className={`${styles.titleRow} ${minimal ? styles.titleRowMinimal : ''}`}>
                <FiMusic className={styles.titleIcon} />
                <div className={styles.title}>{s.name}</div>
              </div>
              <div className={styles.meta}>
                {!minimal && showScope ? <span className={ui.badge}>{s.scope}</span> : null}
                {!minimal ? <span className={ui.badge}>{formatDuration(durations[s.id])}</span> : null}
                {!minimal && Array.isArray(s.categories) && s.categories.length > 0
                  ? s.categories.map((cat, idx) => (
                      <span key={idx} className={ui.badge} style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                        {cat}
                      </span>
                    ))
                  : null}
              </div>
            </div>

            <div className={`${styles.bottom} ${minimal ? styles.bottomMinimal : ''}`}>
              <button
                className={`${minimal ? ui.buttonPrimary : ui.button} ${isCurrent && !isPaused ? ui.buttonPrimary : ''} ${
                  minimal ? styles.bigPlay : ''
                }`}
                type="button"
                onClick={() => toggle(s)}
                disabled={!playable || video}
                title={!playable ? 'Sin fileUrl' : video ? 'Video' : 'Play/Pause'}
              >
                {isCurrent && !isPaused ? <FiPause /> : <FiPlay />}
                {minimal ? null : video ? 'Video' : isCurrent && !isPaused ? 'Pausar' : 'Play'}
              </button>

              {!minimal ? <span className={ui.badge}>ID {s.id}</span> : null}

              {typeof onDelete === 'function' && (!canDelete || canDelete(s)) ? (
                <button
                  className={minimal ? ui.button : ui.button}
                  type="button"
                  onClick={() => onDelete(s)}
                  disabled={isCurrent && !isPaused}
                  title={isCurrent && !isPaused ? 'Pausá antes de eliminar' : 'Eliminar'}
                >
                  Eliminar
                </button>
              ) : null}
            </div>

            {minimal ? <div className={styles.durationMinimal}>{formatDuration(durations[s.id])}</div> : null}

            {video ? (
              <div className={styles.media}>
                <video className={styles.video} controls src={s.fileUrl} preload="metadata" onPlay={() => onVideoPlay(s)} />
              </div>
            ) : null}

            {!minimal ? <div className={styles.path}>{playable ? s.fileUrl : 'Sin archivo asignado'}</div> : null}
          </div>
        )
      })}
    </div>
  )
})

export default SoundGrid
