import { useMemo, useRef, useState } from 'react'
import { FiUploadCloud } from 'react-icons/fi'
import ui from './ui.module.css'
import styles from './fileDropzone.module.css'

export default function FileDropzone({ label, hint, accept, disabled, onFileSelected }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptLabel = useMemo(() => {
    if (!accept) return null
    if (Array.isArray(accept)) return accept.join(', ')
    return String(accept)
  }, [accept])

  function pick() {
    if (disabled) return
    inputRef.current?.click()
  }

  function handleFiles(fileList) {
    if (disabled) return
    const file = fileList?.[0]
    if (!file) return
    onFileSelected?.(file)
  }

  return (
    <div>
      {label ? <div className={styles.label}>{label}</div> : null}

      <div
        className={`${styles.zone} ${dragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''}`}
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') pick()
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (disabled) return
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (disabled) return
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          handleFiles(e.dataTransfer?.files)
        }}
      >
        <div className={styles.icon}>
          <FiUploadCloud />
        </div>
        <div className={styles.mainText}>Arrastrá un archivo aquí o hacé click para seleccionarlo</div>
        {hint ? <div className={ui.muted}>{hint}</div> : null}
        {acceptLabel ? <div className={ui.muted}>Acepta: {acceptLabel}</div> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={Array.isArray(accept) ? accept.join(',') : accept}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
