import { useState, useRef } from 'react'
import { FiUpload, FiX } from 'react-icons/fi'
import ui from './ui/ui.module.css'

export default function AudioFileUploader({ onFileSelect, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [duration, setDuration] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      alert('Por favor selecciona un archivo de audio válido')
      return
    }

    setLoading(true)
    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      const durationInSeconds = audio.duration
      setDuration(durationInSeconds)
      setLoading(false)

      let filePath = file.name
      
      if (file.path) {
        filePath = file.path
      } else if (window.showOpenFilePicker) {
        filePath = file.name
      } else {
        filePath = file.name
      }

      if (onFileSelect) {
        onFileSelect({
          file,
          filePath: filePath,
          fileUrl: url,
          duration: durationInSeconds,
          name: file.name.replace(/\.[^/.]+$/, ''),
        })
      }
    })

    audio.addEventListener('error', () => {
      setLoading(false)
      alert('Error al cargar el archivo de audio')
      clearSelection()
    })
  }

  function clearSelection() {
    if (audioRef.current) {
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    setSelectedFile(null)
    setDuration(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onFileSelect) {
      onFileSelect(null)
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!selectedFile ? (
        <button
          type="button"
          className={ui.button}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          style={{ width: '100%' }}
        >
          <FiUpload /> {loading ? 'Cargando...' : 'Seleccionar archivo de audio'}
        </button>
      ) : (
        <div
          className={ui.listItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 10,
          }}
        >
          <div className={ui.listMain}>
            <div className={ui.listTitle}>{selectedFile.name}</div>
            <div className={ui.listSub}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              {duration && ` • ${formatDuration(duration)}`}
            </div>
          </div>
          <button
            type="button"
            className={ui.button}
            onClick={clearSelection}
            disabled={disabled}
            title="Quitar archivo"
          >
            <FiX />
          </button>
        </div>
      )}
    </div>
  )
}
