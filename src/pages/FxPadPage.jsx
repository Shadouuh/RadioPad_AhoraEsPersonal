import { useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getSounds, createSound, deleteSound } from '../services/soundSupabase'
import { useApiList } from '../hooks/useApiList'
import SoundGrid from '../components/sounds/SoundGrid'
import ui from '../components/ui/ui.module.css'
import Modal from '../components/ui/Modal'
import AudioFileUploader from '../components/AudioFileUploader'
import { ROLES } from '../utils/roles'

export default function FxPadPage() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useApiList(getSounds)

  const [showCreateFx, setShowCreateFx] = useState(false)
  const [newFxName, setNewFxName] = useState('')
  const [newFxFile, setNewFxFile] = useState(null)
  const [newFxScope, setNewFxScope] = useState('institutional')
  const [newFxCategories, setNewFxCategories] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const visibleSounds = useMemo(() => {
    if (!user) return []

    const allowedPrograms = Array.isArray(user.assignedProgramIds) ? user.assignedProgramIds : []

    return data.filter((s) => {
      if (s.scope === 'institutional') return true
      if (s.scope === 'personal') return s.ownerUserId === user.id
      if (s.scope === 'program') return allowedPrograms.includes(s.programId)
      return false
    })
  }, [data, user])

  const canCreateFx = useMemo(() => {
    if (!user) return false
    return user.role === ROLES.CHIEF || user.role === ROLES.OPERATOR
  }, [user])


  async function onDeleteFx(sound) {
    if (!sound?.id) return
    if (!user) return
    if (sound.scope !== 'institutional') return
    if (user.role !== ROLES.CHIEF) return
    const ok = window.confirm(`Eliminar "${sound.name}" de la biblioteca institucional?`)
    if (!ok) return
    try {
      await deleteSound(sound.id)
      refetch()
    } catch {
      setSubmitError('No se pudo eliminar el FX.')
    }
  }

  async function onCreateFx(e) {
    e.preventDefault()
    if (!canCreateFx) return
    if (!user) return
    if (!newFxName.trim()) {
      setSubmitError('Ingresa un nombre para el FX.')
      return
    }
    if (!newFxFile) {
      setSubmitError('Selecciona un archivo de audio.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const categories = newFxCategories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)

      await createSound({
        name: newFxName.trim(),
        scope: 'institutional',
        programId: null,
        ownerUserId: null,
        fileUrl: newFxFile.fileUrl || newFxFile.filePath,
        durationSeconds: newFxFile.duration,
        categories,
      })
      refetch()
      setShowCreateFx(false)
      setNewFxName('')
      setNewFxFile(null)
      setNewFxCategories('')
      setNewFxScope('institutional')
    } catch (err) {
      setSubmitError(err.message || 'No se pudo crear el FX.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Efectos</h1>
          <div className={ui.sub}>Disparo rápido de FX.</div>
        </div>
        <div className={ui.row}>
          <span className={ui.badge}>Visibles: {visibleSounds.length}</span>
          {canCreateFx ? (
            <button
              className={ui.buttonPrimary}
              type="button"
              onClick={() => {
                setSubmitError(null)
                setNewFxScope(user?.role === ROLES.CHIEF ? 'institutional' : 'personal')
                setShowCreateFx(true)
              }}
            >
              <FiPlus /> Añadir FX
            </button>
          ) : null}
        </div>
      </div>

      <div className={ui.card}>
        {loading ? (
          <div className={ui.muted}>Cargando…</div>
        ) : error ? (
          <div className={ui.muted}>No se pudo cargar la lista.</div>
        ) : (
          <SoundGrid
            sounds={visibleSounds}
            emptyText="No hay sonidos visibles."
            variant="minimal"
            canDelete={(s) => s?.scope === 'institutional' && user?.role === ROLES.CHIEF}
            onDelete={onDeleteFx}
          />
        )}
      </div>

      <Modal
        open={showCreateFx}
        title="Nuevo FX Institucional"
        onClose={() => {
          if (submitting) return
          setShowCreateFx(false)
          setNewFxName('')
          setNewFxFile(null)
          setNewFxCategories('')
        }}
        footer={
          <>
            <button 
              className={ui.button} 
              type="button" 
              onClick={() => {
                setShowCreateFx(false)
                setNewFxName('')
                setNewFxFile(null)
                setNewFxCategories('')
              }} 
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              className={ui.buttonPrimary} 
              type="submit" 
              form="create-fx" 
              disabled={submitting || !newFxFile || !newFxName.trim()}
            >
              Crear
            </button>
          </>
        }
      >
        <form id="create-fx" onSubmit={onCreateFx}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Nombre del FX
              </div>
              <input 
                className={ui.input} 
                placeholder="Ej: Cortina institucional"
                value={newFxName} 
                onChange={(e) => setNewFxName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Archivo de audio
              </div>
              <AudioFileUploader
                onFileSelect={(fileData) => setNewFxFile(fileData)}
                disabled={submitting}
              />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Categorías (opcional)
              </div>
              <input
                className={ui.input}
                placeholder="Ej: institucional, apertura, cortina (separadas por comas)"
                value={newFxCategories}
                onChange={(e) => setNewFxCategories(e.target.value)}
                disabled={submitting}
              />
              <div className={ui.muted} style={{ marginTop: 4, fontSize: 12 }}>
                Los FX institucionales son visibles para todos los usuarios en la sección Efectos y en Programas.
              </div>
            </div>
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10, color: '#d32f2f' }}>{submitError}</div> : null}
        </form>
      </Modal>
    </div>
  )
}
