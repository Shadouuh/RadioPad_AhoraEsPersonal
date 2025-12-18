import { useEffect, useMemo, useState } from 'react'
import { FiHeadphones, FiLayers, FiPlus, FiUsers } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { createProgram, getPrograms } from '../services/programSupabase'
import { getSounds } from '../services/soundSupabase'
import { getUsers } from '../services/userService'
import { useApiList } from '../hooks/useApiList'
import ui from '../components/ui/ui.module.css'
import SoundGrid from '../components/sounds/SoundGrid'
import styles from './programs.module.css'
import { ROLES } from '../utils/roles'
import { createSound, deleteSound } from '../services/soundSupabase'
import Modal from '../components/ui/Modal'
import AudioFileUploader from '../components/AudioFileUploader'

const INSTITUTIONAL_ID = 'institutional'

export default function ProgramsPage() {
  const { user } = useAuth()
  const programsQuery = useApiList(getPrograms)
  const soundsQuery = useApiList(getSounds)
  const usersQuery = useApiList(getUsers)

  const [selectedProgramId, setSelectedProgramId] = useState(null)

  const [showCreateProgram, setShowCreateProgram] = useState(false)
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramDescription, setNewProgramDescription] = useState('')

  const [showCreateSound, setShowCreateSound] = useState(false)
  const [selectedFxId, setSelectedFxId] = useState('')
  const [fxSearch, setFxSearch] = useState('')
  const [uploadMode, setUploadMode] = useState('select')
  const [newSoundName, setNewSoundName] = useState('')
  const [newSoundFile, setNewSoundFile] = useState(null)
  const [newSoundCategories, setNewSoundCategories] = useState('')
  
  const [showAssignUsers, setShowAssignUsers] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [userSearch, setUserSearch] = useState('')

  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [highlightSoundId, setHighlightSoundId] = useState(null)

  useEffect(() => {
    if (highlightSoundId == null) return
    const t = setTimeout(() => setHighlightSoundId(null), 1800)
    return () => clearTimeout(t)
  }, [highlightSoundId])

  const institutionalProgram = useMemo(
    () => ({
      id: INSTITUTIONAL_ID,
      name: 'Biblioteca institucional',
      description: 'FX globales para toda la emisora (para todos)',
    }),
    [],
  )

  const visiblePrograms = useMemo(() => {
    if (!user) return []
    if (!Array.isArray(programsQuery.data)) return []

    if (user.role === ROLES.CHIEF) {
      return [institutionalProgram, ...programsQuery.data]
    }

    let basePrograms = programsQuery.data
    if (Array.isArray(user.assignedProgramIds) && user.assignedProgramIds.length > 0) {
      basePrograms = programsQuery.data.filter((p) => user.assignedProgramIds.includes(p.id))
    }

    return [institutionalProgram, ...basePrograms]
  }, [institutionalProgram, programsQuery.data, user])

  useEffect(() => {
    if (selectedProgramId != null) return
    if (visiblePrograms.length === 0) return

    const firstRealProgram = visiblePrograms.find((p) => p.id !== INSTITUTIONAL_ID)
    setSelectedProgramId(firstRealProgram ? firstRealProgram.id : INSTITUTIONAL_ID)
  }, [selectedProgramId, visiblePrograms])

  const selectedProgram = useMemo(() => {
    if (selectedProgramId == null) return null
    return visiblePrograms.find((p) => p.id === selectedProgramId) || null
  }, [selectedProgramId, visiblePrograms])

  const programSounds = useMemo(() => {
    if (!selectedProgram) return []
    if (!Array.isArray(soundsQuery.data)) return []

    if (selectedProgram.id === INSTITUTIONAL_ID) {
      return soundsQuery.data.filter((s) => s.scope === 'institutional')
    }

    return soundsQuery.data.filter(
      (s) => s.scope === 'program' && s.programId === selectedProgram.id,
    )
  }, [selectedProgram, soundsQuery.data])

  const assignedFileUrls = useMemo(() => {
    if (!selectedProgram) return new Set()
    if (selectedProgram.id === INSTITUTIONAL_ID) return new Set()
    const set = new Set()
    programSounds.forEach((s) => {
      if (typeof s?.fileUrl === 'string' && s.fileUrl.trim()) {
        set.add(s.fileUrl.trim())
      }
    })
    return set
  }, [programSounds, selectedProgram])

  const assignedUsers = useMemo(() => {
    if (!selectedProgram) return []
    if (selectedProgram.id === INSTITUTIONAL_ID) return []
    if (!Array.isArray(usersQuery.data)) return []

    return usersQuery.data.filter(
      (u) => Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.includes(selectedProgram.id),
    )
  }, [selectedProgram, usersQuery.data])

  const canCreateProgram = user?.role === ROLES.CHIEF

  function initials(name) {
    const text = String(name || '').trim()
    if (!text) return '??'
    const parts = text.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] || ''
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : parts[0]?.[1] || ''
    return `${a}${b}`.toUpperCase()
  }

  const canAssignFx = useMemo(() => {
    if (!user) return false
    if (!selectedProgram) return false

    if (selectedProgram.id === INSTITUTIONAL_ID) {
      return false
    }

    return user.role === ROLES.CHIEF || user.role === ROLES.OPERATOR
  }, [selectedProgram, user])

  async function onCreateProgram(e) {
    e.preventDefault()
    if (!canCreateProgram) return
    if (!newProgramName.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const created = await createProgram({
        name: newProgramName.trim(),
        description: newProgramDescription.trim(),
      })
      programsQuery.refetch()
      setSelectedProgramId(created?.id ?? null)
      setShowCreateProgram(false)
      setNewProgramName('')
      setNewProgramDescription('')
    } catch {
      setSubmitError('No se pudo crear el programa.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onCreateSound(e) {
    e.preventDefault()
    if (!canAssignFx) return
    if (!selectedProgram) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      let created

      if (uploadMode === 'select') {
        if (!selectedFxId) {
          setSubmitError('Selecciona un FX de la lista.')
          setSubmitting(false)
          return
        }

        const source = Array.isArray(soundsQuery.data)
          ? soundsQuery.data.find((s) => String(s.id) === String(selectedFxId))
          : null

        if (!source) {
          setSubmitError('FX no encontrado.')
          setSubmitting(false)
          return
        }

        const srcUrl = source.fileUrl ? String(source.fileUrl).trim() : ''
        if (!srcUrl) {
          setSubmitError('El FX seleccionado no tiene archivo.')
          setSubmitting(false)
          return
        }

        if (assignedFileUrls.has(srcUrl)) {
          setSubmitError('Este FX ya está asignado a este programa.')
          setSubmitting(false)
          return
        }

        created = await createSound({
          name: source.name,
          scope: 'program',
          programId: selectedProgram.id,
          ownerUserId: null,
          fileUrl: srcUrl,
          durationSeconds: source.durationSeconds,
          categories: source.categories || [],
        })
      } else {
        if (!newSoundFile) {
          setSubmitError('Selecciona un archivo de audio.')
          setSubmitting(false)
          return
        }

        if (!newSoundName.trim()) {
          setSubmitError('Ingresa un nombre para el sonido.')
          setSubmitting(false)
          return
        }

        const categories = newSoundCategories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)

        created = await createSound({
          name: newSoundName.trim(),
          scope: 'program',
          programId: selectedProgram.id,
          ownerUserId: null,
          fileUrl: newSoundFile.fileUrl || newSoundFile.filePath,
          durationSeconds: newSoundFile.duration,
          categories,
        })
      }

      soundsQuery.refetch()
      setHighlightSoundId(created?.id ?? null)
      setShowCreateSound(false)
      setSelectedFxId('')
      setFxSearch('')
      setUploadMode('select')
      setNewSoundName('')
      setNewSoundFile(null)
      setNewSoundCategories('')
    } catch (err) {
      setSubmitError(err.message || 'No se pudo crear el FX.')
    } finally {
      setSubmitting(false)
    }
  }

  const fxSources = useMemo(() => {
    if (!user) return { institutional: [], personal: [] }
    const list = Array.isArray(soundsQuery.data) ? soundsQuery.data : []

    const institutional = list.filter(
      (s) => s.scope === 'institutional' && typeof s.fileUrl === 'string' && s.fileUrl.trim(),
    )
    const personal = list.filter(
      (s) =>
        s.scope === 'personal' &&
        s.ownerUserId === user.id &&
        typeof s.fileUrl === 'string' &&
        s.fileUrl.trim(),
    )

    const q = fxSearch.trim().toLowerCase()
    if (!q) return { institutional, personal }

    const match = (s) => String(s.name || '').toLowerCase().includes(q)
    return {
      institutional: institutional.filter(match),
      personal: personal.filter(match),
    }
  }, [fxSearch, soundsQuery.data, user])

  const fxAlreadyAssigned = useMemo(() => {
    const has = (s) => {
      const url = typeof s?.fileUrl === 'string' ? s.fileUrl.trim() : ''
      return url ? assignedFileUrls.has(url) : false
    }
    return {
      institutional: fxSources.institutional.map((s) => ({ s, already: has(s) })),
      personal: fxSources.personal.map((s) => ({ s, already: has(s) })),
    }
  }, [assignedFileUrls, fxSources.institutional, fxSources.personal])

  async function onDeleteProgramSound(sound) {
    if (!sound?.id) return
    if (!selectedProgram || selectedProgram.id === INSTITUTIONAL_ID) return
    if (sound.scope !== 'program') return
    if (sound.programId !== selectedProgram.id) return
    const ok = window.confirm(`Eliminar "${sound.name}" del programa?`)
    if (!ok) return
    try {
      await deleteSound(sound.id)
      soundsQuery.refetch()
    } catch {
      setSubmitError('No se pudo eliminar el FX del programa.')
    }
  }

  async function onAssignUsers(e) {
    e.preventDefault()
    if (!selectedProgram || selectedProgram.id === INSTITUTIONAL_ID) return
    if (selectedUserIds.length === 0) {
      setSubmitError('Selecciona al menos un usuario.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const { updateUser } = await import('../services/userService')
      
      for (const userId of selectedUserIds) {
        const userToUpdate = usersQuery.data.find(u => u.id === userId)
        if (!userToUpdate) continue

        const currentProgramIds = Array.isArray(userToUpdate.assignedProgramIds) 
          ? userToUpdate.assignedProgramIds 
          : []
        
        if (!currentProgramIds.includes(selectedProgram.id)) {
          const newProgramIds = [...currentProgramIds, selectedProgram.id]
          await updateUser(userId, { assignedProgramIds: newProgramIds })
        }
      }

      usersQuery.refetch()
      setShowAssignUsers(false)
      setSelectedUserIds([])
      setUserSearch('')
    } catch (err) {
      setSubmitError(err.message || 'No se pudieron asignar los usuarios.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Programas</h1>
          <div className={ui.sub}>Perfiles de programa y FX dedicados.</div>
        </div>
        <div className={ui.row}>
          <span className={ui.badge}>
            <FiLayers /> {visiblePrograms.length}
          </span>
          {canCreateProgram ? (
            <button
              className={ui.buttonPrimary}
              type="button"
              onClick={() => {
                setSubmitError(null)
                setShowCreateProgram(true)
              }}
            >
              Añadir programa
            </button>
          ) : null}
        </div>
      </div>

      {programsQuery.loading ? (
        <div className={ui.card}>
          <div className={ui.muted}>Cargando…</div>
        </div>
      ) : programsQuery.error ? (
        <div className={ui.card}>
          <div className={ui.muted}>No se pudo cargar la lista.</div>
        </div>
      ) : visiblePrograms.length === 0 ? (
        <div className={ui.card}>
          <div className={ui.cardTitle}>Sin programas</div>
          <div className={ui.muted}>No tenés programas asignados o no hay programas cargados.</div>
        </div>
      ) : (
        <div className={styles.split}>
          <div className={styles.left}>
            <div className={ui.card}>
              <div className={ui.cardTitle}>Programas</div>

              <div className={styles.programNav}>
                {visiblePrograms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`${styles.programItem} ${p.id === selectedProgramId ? styles.programItemActive : ''}`}
                  >
                    <div className={styles.programName}>{p.name}</div>
                    <div className={styles.programDesc}>{p.description}</div>
                    <div className={styles.programMeta}>
                      {p.id === INSTITUTIONAL_ID ? (
                        <span className={ui.badge}>Para todos</span>
                      ) : (
                        <span className={ui.badge}>
                          <FiUsers />{' '}
                          {Array.isArray(usersQuery.data)
                            ? usersQuery.data.filter(
                                (u) =>
                                  Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.includes(p.id),
                              ).length
                            : 0}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className={ui.card} style={{ marginBottom: 12 }}>
              <div className={ui.pageHeader} style={{ marginBottom: 0 }}>
                <div>
                  <div className={ui.cardTitle} style={{ marginBottom: 4 }}>
                    {selectedProgram ? selectedProgram.name : 'Seleccioná un programa'}
                  </div>
                  <div className={ui.muted}>{selectedProgram ? selectedProgram.description : ''}</div>
                </div>
                <div className={ui.row}>
                  <span className={ui.badge}>ID {selectedProgram?.id ?? '-'}</span>
                  <span className={ui.badge}>
                    <FiHeadphones /> {programSounds.length}
                  </span>
                </div>
              </div>
            </div>

            <div className={ui.card} style={{ marginBottom: 12 }}>
              <div className={ui.cardTitle}>
                {selectedProgram?.id === INSTITUTIONAL_ID ? 'Sonidos institucionales' : 'Sonidos del programa'}
              </div>

              {selectedProgram?.id === INSTITUTIONAL_ID ? (
                <div className={ui.muted} style={{ marginBottom: 10 }}>
                  Los FX institucionales se crean en la sección Efectos.
                </div>
              ) : canAssignFx ? (
                <div className={ui.row} style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={ui.muted}>
                    {selectedProgram?.id === INSTITUTIONAL_ID
                      ? 'Institucional: para todos.'
                      : 'Programa: asignado.'}
                  </span>
                  <button
                    className={ui.buttonPrimary}
                    type="button"
                    onClick={() => {
                      setSubmitError(null)
                      setShowCreateSound(true)
                    }}
                  >
                    <FiPlus /> Asignar FX
                  </button>
                </div>
              ) : (
                <div className={ui.muted} style={{ marginBottom: 10 }}>
                  {selectedProgram?.id === INSTITUTIONAL_ID
                    ? 'Solo el Jefe puede modificar la biblioteca institucional.'
                    : 'Solo el Jefe/Operador pueden añadir sonidos al programa.'}
                </div>
              )}

              {soundsQuery.loading ? (
                <div className={ui.muted}>Cargando sonidos…</div>
              ) : soundsQuery.error ? (
                <div className={ui.muted}>No se pudieron cargar los sonidos.</div>
              ) : (
                <SoundGrid
                  sounds={programSounds}
                  highlightId={highlightSoundId}
                  variant="minimal"
                  canDelete={(s) => s?.scope === 'program' && selectedProgram?.id !== INSTITUTIONAL_ID}
                  onDelete={selectedProgram?.id === INSTITUTIONAL_ID ? null : onDeleteProgramSound}
                  emptyText={
                    selectedProgram?.id === INSTITUTIONAL_ID
                      ? 'Todavía no hay sonidos institucionales cargados.'
                      : 'Este programa todavía no tiene sonidos asociados.'
                  }
                />
              )}
            </div>

            {selectedProgram?.id !== INSTITUTIONAL_ID ? (
              <div className={ui.card}>
                <div className={ui.pageHeader} style={{ marginBottom: 10 }}>
                  <div>
                    <div className={ui.cardTitle}>Personas asignadas</div>
                    <div className={ui.muted}>
                      {user?.role === 'chief'
                        ? 'Usuarios con acceso a este programa.'
                        : 'Visible para referencia (solo lectura).'}
                    </div>
                  </div>
                  {user?.role === 'chief' ? (
                    <button
                      className={ui.buttonPrimary}
                      type="button"
                      onClick={() => setShowAssignUsers(true)}
                    >
                      <FiPlus /> Asignar usuarios
                    </button>
                  ) : null}
                </div>

                {usersQuery.loading ? (
                  <div className={ui.muted}>Cargando…</div>
                ) : usersQuery.error ? (
                  <div className={ui.muted}>No se pudieron cargar los usuarios.</div>
                ) : assignedUsers.length === 0 ? (
                  <div className={ui.muted}>No hay usuarios asignados a este programa.</div>
                ) : (
                  <div>
                    <div className={styles.peopleGrid}>
                      {(user?.role === 'chief' ? assignedUsers : assignedUsers.slice(0, 3)).map((u) => (
                        <div key={u.id} className={styles.personChip}>
                          <div className={styles.avatar}>{initials(u.fullName)}</div>
                          <div className={styles.personInfo}>
                            <div className={styles.personName}>{u.fullName}</div>
                            <div className={styles.personSub}>@{u.username}</div>
                          </div>
                          <div className={styles.personMeta}>
                            <span className={ui.badge}>{u.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {user?.role !== 'chief' && assignedUsers.length > 3 ? (
                      <div className={ui.muted} style={{ marginTop: 10 }}>
                        …y {assignedUsers.length - 3} más
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        open={showCreateProgram}
        title="Nuevo programa"
        onClose={() => {
          if (submitting) return
          setShowCreateProgram(false)
        }}
        footer={
          <>
            <button className={ui.button} type="button" onClick={() => setShowCreateProgram(false)} disabled={submitting}>
              Cancelar
            </button>
            <button className={ui.buttonPrimary} type="submit" form="create-program" disabled={submitting}>
              Crear
            </button>
          </>
        }
      >
        <form id="create-program" onSubmit={onCreateProgram}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Nombre
              </div>
              <input
                className={ui.input}
                placeholder="Nombre del programa"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Descripción
              </div>
              <input
                className={ui.input}
                placeholder="Descripción (opcional)"
                value={newProgramDescription}
                onChange={(e) => setNewProgramDescription(e.target.value)}
              />
            </div>
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10 }}>{submitError}</div> : null}
        </form>
      </Modal>

      <Modal
        open={showCreateSound}
        title="Asignar FX al programa"
        onClose={() => {
          if (submitting) return
          setShowCreateSound(false)
          setSelectedFxId('')
          setFxSearch('')
          setUploadMode('select')
          setNewSoundName('')
          setNewSoundFile(null)
          setNewSoundCategories('')
        }}
        footer={
          <>
            <button
              className={ui.button}
              type="button"
              onClick={() => {
                setShowCreateSound(false)
                setSelectedFxId('')
                setFxSearch('')
                setUploadMode('select')
                setNewSoundName('')
                setNewSoundFile(null)
                setNewSoundCategories('')
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              className={ui.buttonPrimary} 
              type="submit" 
              form="create-sound" 
              disabled={submitting || (uploadMode === 'select' ? !selectedFxId : !newSoundFile || !newSoundName.trim())}
            >
              {uploadMode === 'select' ? 'Asignar' : 'Crear y Asignar'}
            </button>
          </>
        }
      >
        <form id="create-sound" onSubmit={onCreateSound}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12', marginBottom: 16 }}>
              <div className={ui.row} style={{ gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  className={uploadMode === 'select' ? ui.buttonPrimary : ui.button}
                  onClick={() => setUploadMode('select')}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Seleccionar existente
                </button>
                <button
                  type="button"
                  className={uploadMode === 'upload' ? ui.buttonPrimary : ui.button}
                  onClick={() => setUploadMode('upload')}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Cargar nuevo
                </button>
              </div>
            </div>

            {uploadMode === 'select' ? (
              <div style={{ gridColumn: 'span 12' }}>
                <div className={ui.muted} style={{ marginBottom: 6 }}>
                  FX disponible
                </div>
                <div className={ui.row}>
                  <input
                    className={ui.input}
                    placeholder="Buscar FX…"
                    value={fxSearch}
                    onChange={(e) => setFxSearch(e.target.value)}
                  />
                  <button
                    className={ui.button}
                    type="button"
                    onClick={() => setSelectedFxId('')}
                    disabled={!selectedFxId}
                    title="Deseleccionar"
                  >
                    Limpiar
                  </button>
                </div>

                <div className={ui.list} style={{ marginTop: 10, maxHeight: 300, overflow: 'auto' }}>
                {fxSources.institutional.length === 0 && fxSources.personal.length === 0 ? (
                  <div className={ui.muted}>No hay FX que coincidan.</div>
                ) : (
                  <>
                    <div className={ui.muted} style={{ marginTop: 4, marginBottom: 6 }}>
                      Institucionales
                    </div>
                    {fxAlreadyAssigned.institutional.length === 0 ? (
                      <div className={ui.muted} style={{ marginBottom: 10 }}>
                        (Sin resultados)
                      </div>
                    ) : (
                      fxAlreadyAssigned.institutional.map(({ s, already }) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            already
                              ? null
                              : setSelectedFxId((prev) => (String(prev) === String(s.id) ? '' : String(s.id)))
                          }
                          className={ui.listItem}
                          style={{
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            borderColor: String(s.id) === String(selectedFxId) ? 'var(--accent)' : undefined,
                            opacity: already ? 0.55 : 1,
                          }}
                          disabled={already}
                        >
                          <div className={ui.listMain}>
                            <div className={ui.listTitle}>{s.name}</div>
                            <div className={ui.listSub}>ID {s.id}</div>
                          </div>
                          <div className={ui.listMeta}>
                            <span className={ui.badge}>Institucional</span>
                            {already ? <span className={ui.badge}>Ya asignado</span> : null}
                            <span className={ui.badge}>
                              {String(s.id) === String(selectedFxId) ? 'Seleccionado' : 'Elegir'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}

                    <div className={ui.muted} style={{ marginTop: 10, marginBottom: 6 }}>
                      Personales / generales
                    </div>
                    {fxAlreadyAssigned.personal.length === 0 ? (
                      <div className={ui.muted}>(Sin resultados)</div>
                    ) : (
                      fxAlreadyAssigned.personal.map(({ s, already }) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            already
                              ? null
                              : setSelectedFxId((prev) => (String(prev) === String(s.id) ? '' : String(s.id)))
                          }
                          className={ui.listItem}
                          style={{
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            borderColor: String(s.id) === String(selectedFxId) ? 'var(--accent)' : undefined,
                            opacity: already ? 0.55 : 1,
                          }}
                          disabled={already}
                        >
                          <div className={ui.listMain}>
                            <div className={ui.listTitle}>{s.name}</div>
                            <div className={ui.listSub}>ID {s.id}</div>
                          </div>
                          <div className={ui.listMeta}>
                            <span className={ui.badge}>Personal</span>
                            {already ? <span className={ui.badge}>Ya asignado</span> : null}
                            <span className={ui.badge}>
                              {String(s.id) === String(selectedFxId) ? 'Seleccionado' : 'Elegir'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
              </div>
            ) : (
              <div style={{ gridColumn: 'span 12' }}>
                <div className={ui.muted} style={{ marginBottom: 6 }}>
                  Nombre del sonido
                </div>
                <input
                  className={ui.input}
                  placeholder="Ej: Cortina de apertura"
                  value={newSoundName}
                  onChange={(e) => setNewSoundName(e.target.value)}
                  disabled={submitting}
                />

                <div className={ui.muted} style={{ marginTop: 12, marginBottom: 6 }}>
                  Archivo de audio
                </div>
                <AudioFileUploader
                  onFileSelect={(fileData) => setNewSoundFile(fileData)}
                  disabled={submitting}
                />

                <div className={ui.muted} style={{ marginTop: 12, marginBottom: 6 }}>
                  Categorías (opcional)
                </div>
                <input
                  className={ui.input}
                  placeholder="Ej: musica, comedia, noticia (separadas por comas)"
                  value={newSoundCategories}
                  onChange={(e) => setNewSoundCategories(e.target.value)}
                  disabled={submitting}
                />
                <div className={ui.muted} style={{ marginTop: 4, fontSize: 12 }}>
                  Separa las categorías con comas. Ejemplos: musica, comedia, noticia, institucional
                </div>
              </div>
            )}
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10, color: '#d32f2f' }}>{submitError}</div> : null}
        </form>
      </Modal>

      <Modal
        open={showAssignUsers}
        title="Asignar usuarios al programa"
        onClose={() => {
          if (submitting) return
          setShowAssignUsers(false)
          setSelectedUserIds([])
          setUserSearch('')
        }}
        footer={
          <>
            <button
              className={ui.button}
              type="button"
              onClick={() => {
                setShowAssignUsers(false)
                setSelectedUserIds([])
                setUserSearch('')
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              className={ui.buttonPrimary}
              type="submit"
              form="assign-users"
              disabled={submitting || selectedUserIds.length === 0}
            >
              Asignar {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
            </button>
          </>
        }
      >
        <form id="assign-users" onSubmit={onAssignUsers}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Buscar usuarios
              </div>
              <input
                className={ui.input}
                placeholder="Buscar por nombre..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Usuarios disponibles ({usersQuery.data?.filter(u => {
                  const alreadyAssigned = Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.includes(selectedProgram?.id)
                  const matchesSearch = userSearch.trim() === '' || u.fullName.toLowerCase().includes(userSearch.toLowerCase())
                  return !alreadyAssigned && matchesSearch
                }).length || 0})
              </div>

              <div className={ui.list} style={{ maxHeight: 400, overflow: 'auto' }}>
                {usersQuery.loading ? (
                  <div className={ui.muted}>Cargando usuarios...</div>
                ) : usersQuery.error ? (
                  <div className={ui.muted}>Error al cargar usuarios.</div>
                ) : (
                  usersQuery.data
                    ?.filter(u => {
                      const alreadyAssigned = Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.includes(selectedProgram?.id)
                      const matchesSearch = userSearch.trim() === '' || u.fullName.toLowerCase().includes(userSearch.toLowerCase())
                      return !alreadyAssigned && matchesSearch
                    })
                    .map(u => {
                      const isSelected = selectedUserIds.includes(u.id)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserIds(prev =>
                              prev.includes(u.id)
                                ? prev.filter(id => id !== u.id)
                                : [...prev, u.id]
                            )
                          }}
                          className={ui.listItem}
                          style={{
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            borderColor: isSelected ? 'var(--accent)' : undefined,
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined,
                          }}
                        >
                          <div className={ui.listMain}>
                            <div className={ui.listTitle}>{u.fullName}</div>
                            <div className={ui.listSub}>@{u.username} • {u.role}</div>
                          </div>
                          <div className={ui.listMeta}>
                            <span className={ui.badge}>
                              {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                )}
              </div>
            </div>
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10, color: '#d32f2f' }}>{submitError}</div> : null}
        </form>
      </Modal>
    </div>
  )
}
