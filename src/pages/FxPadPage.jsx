import { useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getSounds } from '../services/soundService'
import { createSound } from '../services/soundService'
import { deleteSound } from '../services/soundService'
import { useApiList } from '../hooks/useApiList'
import SoundGrid from '../components/sounds/SoundGrid'
import ui from '../components/ui/ui.module.css'
import Modal from '../components/ui/Modal'
import FileDropzone from '../components/ui/FileDropzone'
import { uploadFile } from '../services/uploadService'
import { ROLES } from '../utils/roles'

export default function FxPadPage() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useApiList(getSounds)

  const [showCreateFx, setShowCreateFx] = useState(false)
  const [newFxName, setNewFxName] = useState('')
  const [newFxFileUrl, setNewFxFileUrl] = useState('')
  const [newFxFileName, setNewFxFileName] = useState('')
  const [newFxScope, setNewFxScope] = useState('personal')
  const [uploadingFile, setUploadingFile] = useState(false)
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

  async function onPickFxFile(file) {
    if (!file) return
    setSubmitError(null)
    setUploadingFile(true)
    setNewFxFileName(file.name)
    try {
      const result = await uploadFile(file)
      setNewFxFileUrl(result?.url ? String(result.url) : '')
    } catch {
      setSubmitError('No se pudo subir el archivo. Verificá que el upload server esté corriendo.')
    } finally {
      setUploadingFile(false)
    }
  }

  async function onDeleteFx(sound) {
    if (!sound?.id) return
    if (!user) return
    if (sound.scope !== 'personal') return
    if (sound.ownerUserId !== user.id) return
    const ok = window.confirm(`Eliminar "${sound.name}"?`)
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
    if (!newFxName.trim()) return
    if (!newFxFileUrl.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const requested = String(newFxScope || 'personal')
      const scope = user.role === ROLES.CHIEF ? requested : 'personal'
      const ownerUserId = scope === 'personal' ? user.id : null
      await createSound({
        name: newFxName.trim(),
        scope,
        programId: null,
        ownerUserId,
        fileUrl: newFxFileUrl.trim(),
      })
      refetch()
      setShowCreateFx(false)
      setNewFxName('')
      setNewFxFileUrl('')
      setNewFxFileName('')
      setNewFxScope(user.role === ROLES.CHIEF ? 'institutional' : 'personal')
    } catch {
      setSubmitError('No se pudo crear el FX.')
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
            canDelete={(s) => s?.scope === 'personal' && user?.id != null && s.ownerUserId === user.id}
            onDelete={onDeleteFx}
          />
        )}
      </div>

      <Modal
        open={showCreateFx}
        title="Nuevo FX"
        onClose={() => {
          if (submitting) return
          setShowCreateFx(false)
        }}
        footer={
          <>
            <button className={ui.button} type="button" onClick={() => setShowCreateFx(false)} disabled={submitting}>
              Cancelar
            </button>
            <button className={ui.buttonPrimary} type="submit" form="create-fx" disabled={submitting || uploadingFile}>
              Crear
            </button>
          </>
        }
      >
        <form id="create-fx" onSubmit={onCreateFx}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Nombre
              </div>
              <input className={ui.input} value={newFxName} onChange={(e) => setNewFxName(e.target.value)} />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Categoría
              </div>
              <select
                className={ui.input}
                value={newFxScope}
                onChange={(e) => setNewFxScope(e.target.value)}
                disabled={user?.role !== ROLES.CHIEF}
                title={user?.role !== ROLES.CHIEF ? 'Solo el Jefe puede crear FX institucionales' : undefined}
              >
                {user?.role === ROLES.CHIEF ? <option value="institutional">Institucional</option> : null}
                <option value="personal">Personal / general</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 12' }}>
              <FileDropzone
                label="Archivo (mp3/wav/ogg/mp4)"
                hint={newFxFileName ? `Seleccionado: ${newFxFileName}` : 'Se guarda en /uploads y se genera la URL automáticamente.'}
                accept={[".mp3", ".wav", ".ogg", ".mp4"]}
                disabled={uploadingFile || submitting}
                onFileSelected={onPickFxFile}
              />
            </div>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                fileUrl
              </div>
              <input
                className={ui.input}
                placeholder="/audio/aplausos.mp3 o https://..."
                value={newFxFileUrl}
                onChange={(e) => setNewFxFileUrl(e.target.value)}
                disabled={uploadingFile}
              />
              {uploadingFile ? <div className={ui.muted} style={{ marginTop: 8 }}>Subiendo archivo…</div> : null}
            </div>
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10 }}>{submitError}</div> : null}
        </form>
      </Modal>
    </div>
  )
}
