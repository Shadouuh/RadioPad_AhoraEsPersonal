import { useMemo } from 'react'
import { FiChevronDown, FiChevronUp, FiPause, FiPlay, FiVolume2 } from 'react-icons/fi'
import { useAudioPlayer } from '../../context/AudioPlayerContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import ui from '../ui/ui.module.css'
import styles from './globalAudioPlayer.module.css'

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '--:--'
  return formatTime(totalSeconds)
}

export default function GlobalAudioPlayer() {
  const { currentSound, isPlaying, currentTime, duration, volume, toggle, seek, setVolume } = useAudioPlayer()

  const [collapsed, setCollapsed] = useLocalStorage('radiopad_player_collapsed', false)

  const title = useMemo(() => {
    if (!currentSound) return 'Reproductor'
    return currentSound.name || 'Sin título'
  }, [currentSound])

  const progress = useMemo(() => {
    if (!Number.isFinite(duration) || duration <= 0) return 0
    return Math.min(100, Math.max(0, (currentTime / duration) * 100))
  }, [currentTime, duration])

  const progressMax = useMemo(() => {
    const d = Number.isFinite(duration) ? duration : 0
    const t = Number.isFinite(currentTime) ? currentTime : 0
    if (d > 0) return d
    return Math.max(10, t)
  }, [currentTime, duration])

  const progressValue = useMemo(() => {
    const t = Number.isFinite(currentTime) ? currentTime : 0
    return Math.min(progressMax, Math.max(0, t))
  }, [currentTime, progressMax])

  const progressPct = useMemo(() => {
    if (Number.isFinite(duration) && duration > 0) return Math.round(progress)
    if (!Number.isFinite(progressMax) || progressMax <= 0) return 0
    return Math.round(Math.min(100, Math.max(0, (progressValue / progressMax) * 100)))
  }, [duration, progress, progressMax, progressValue])

  const volumePct = useMemo(() => {
    const v = Number.isFinite(volume) ? volume : 0
    return Math.round(Math.min(1, Math.max(0, v)) * 100)
  }, [volume])

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${collapsed ? styles.cardCollapsed : ''}`}>
        <div className={styles.top}>
          <div className={styles.title}>
            {title}{' '}
            <span className={styles.status} data-on={isPlaying ? '1' : '0'}>
              {isPlaying ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className={styles.controls}>
            <button
              className={ui.button}
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'Expandir' : 'Colapsar'}
            >
              {collapsed ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            <button
              className={`${ui.button} ${isPlaying ? ui.buttonPrimary : ''}`}
              type="button"
              onClick={() => (currentSound ? toggle(currentSound) : null)}
              disabled={!currentSound}
              title={!currentSound ? 'Seleccioná un sonido' : isPlaying ? 'Pausar' : 'Play'}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
            </button>
          </div>
        </div>

        <div className={`${styles.progressRow} ${collapsed ? styles.hidden : ''}`}>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={progressMax}
            step={0.01}
            value={progressValue}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!currentSound}
            aria-label="Progreso"
          />
          <div className={styles.time}>
            {formatTime(currentTime)} / {formatDuration(duration)}
          </div>
        </div>

        <div className={`${styles.bottom} ${collapsed ? styles.hidden : ''}`}>
          <div className={styles.volume}>
            <span className={styles.volIcon}>
              <FiVolume2 />
            </span>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volumen"
            />
          </div>
          <div className={styles.meta}>
            <div className={ui.muted}>{progressPct}%</div>
            <div className={ui.muted}>{volumePct}%</div>
          </div>
        </div>

        <div className={`${styles.miniRow} ${collapsed ? '' : styles.hidden}`}>
          <div className={styles.miniProgress}>
            <div className={styles.miniBar} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={styles.miniMeta}>
            <span className={ui.muted}>{formatTime(currentTime)}</span>
            <span className={ui.muted}>{progressPct}%</span>
            <span className={ui.muted}>{volumePct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
