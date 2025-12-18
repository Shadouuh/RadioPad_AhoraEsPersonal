import { useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiUsers } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getPrograms } from '../services/programSupabase'
import { createUser, deleteUser, getUsers, updateUser } from '../services/userSupabase'
import { useApiList } from '../hooks/useApiList'
import { ROLE_LABELS } from '../utils/roles'
import ui from '../components/ui/ui.module.css'
import Modal from '../components/ui/Modal'

export default function UsersPage() {
  const { user: me } = useAuth()
  const { data, loading, error, refetch } = useApiList(getUsers)
  const { data: programs, loading: programsLoading } = useApiList(getPrograms)

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('operator')
  const [createProgramIds, setCreateProgramIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [expandedUserIds, setExpandedUserIds] = useState([])

  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('operator')
  const [editProgramIds, setEditProgramIds] = useState([])
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState(null)

  const [showDeleteUser, setShowDeleteUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const chiefCount = useMemo(() => {
    if (!Array.isArray(data)) return 0
    return data.filter((u) => u?.role === 'chief').length
  }, [data])

  const programsById = useMemo(() => {
    const map = new Map()
    if (Array.isArray(programs)) {
      for (const p of programs) {
        map.set(String(p.id), p)
      }
    }
    return map
  }, [programs])

  function toggleId(list, id) {
    const key = Number(id)
    if (!Number.isFinite(key)) return list
    if (list.includes(key)) return list.filter((x) => x !== key)
    return [...list, key]
  }

  function toggleExpandedUser(id) {
    const key = Number(id)
    if (!Number.isFinite(key)) return
    setExpandedUserIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))
  }

  async function onCreateUser(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim() || !fullName.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await createUser({
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        role,
        assignedProgramIds: createProgramIds,
      })

      refetch()
      setShowCreateUser(false)
      setUsername('')
      setPassword('')
      setFullName('')
      setRole('operator')
      setCreateProgramIds([])
    } catch {
      setSubmitError('No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onEditUser(e) {
    e.preventDefault()
    if (!editingUser?.id) return

    setEditSubmitting(true)
    setEditError(null)

    try {
      await updateUser(editingUser.id, {
        role: editRole,
        assignedProgramIds: editProgramIds,
      })
      refetch()
      setShowEditUser(false)
      setEditingUser(null)
    } catch {
      setEditError('No se pudo actualizar el usuario.')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function onConfirmDelete() {
    if (!deletingUser?.id) return

    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      await deleteUser(deletingUser.id)
      refetch()
      setShowDeleteUser(false)
      setDeletingUser(null)
    } catch {
      setDeleteError('No se pudo eliminar el usuario.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Usuarios</h1>
          <div className={ui.sub}>Administración de cuentas y permisos.</div>
        </div>
        <div className={ui.row}>
          <span className={ui.badge}>
            <FiUsers /> Admin
          </span>
          <button
            className={ui.buttonPrimary}
            type="button"
            onClick={() => {
              setSubmitError(null)
              setShowCreateUser(true)
            }}
          >
            Añadir usuario
          </button>
        </div>
      </div>

      {loading ? (
        <div className={ui.card}>
          <div className={ui.muted}>Cargando…</div>
        </div>
      ) : error ? (
        <div className={ui.card}>
          <div className={ui.muted}>No se pudo cargar la lista.</div>
        </div>
      ) : (
        <div className={ui.list}>
          {data.map((u) => (
            <div key={u.id} className={ui.listItem}>
              <div className={ui.listMain}>
                <div className={ui.listTitle}>{u.fullName}</div>
                <div className={ui.listSub}>@{u.username}</div>

                {expandedUserIds.includes(Number(u.id)) ? (
                  <div className={ui.muted} style={{ marginTop: 8 }}>
                    {Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.length ? (
                      <div>
                        {u.assignedProgramIds
                          .map((id) => programsById.get(String(id))?.name || `#${id}`)
                          .join(' · ')}
                      </div>
                    ) : (
                      <div>Sin programas asignados.</div>
                    )}
                  </div>
                ) : null}
              </div>
              <div className={ui.listMeta}>
                <span className={ui.badge}>{ROLE_LABELS[u.role] || u.role}</span>
                <span className={ui.badge}>
                  Programas:{' '}
                  {Array.isArray(u.assignedProgramIds) && u.assignedProgramIds.length > 0
                    ? u.assignedProgramIds.length
                    : 0}
                </span>
                <span className={ui.badge}>ID {u.id}</span>

                <button className={ui.button} type="button" onClick={() => toggleExpandedUser(u.id)}>
                  {expandedUserIds.includes(Number(u.id)) ? <FiChevronUp /> : <FiChevronDown />} Programas
                </button>

                <button
                  className={ui.button}
                  type="button"
                  onClick={() => {
                    setEditError(null)
                    setEditingUser(u)
                    setEditRole(u.role || 'operator')
                    setEditProgramIds(Array.isArray(u.assignedProgramIds) ? u.assignedProgramIds : [])
                    setShowEditUser(true)
                  }}
                >
                  Editar
                </button>

                <button
                  className={ui.button}
                  type="button"
                  disabled={me?.id != null && String(me.id) === String(u.id)}
                  onClick={() => {
                    setDeleteError(null)
                    setDeletingUser(u)
                    setShowDeleteUser(true)
                  }}
                  title={me?.id != null && String(me.id) === String(u.id) ? 'No podés eliminar tu propio usuario' : 'Eliminar'}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCreateUser}
        title="Nuevo usuario"
        onClose={() => {
          if (submitting) return
          setShowCreateUser(false)
        }}
        footer={
          <>
            <button className={ui.button} type="button" onClick={() => setShowCreateUser(false)} disabled={submitting}>
              Cancelar
            </button>
            <button className={ui.buttonPrimary} type="submit" form="create-user" disabled={submitting}>
              Crear
            </button>
          </>
        }
      >
        <form id="create-user" onSubmit={onCreateUser}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 6' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Email
              </div>
              <input className={ui.input} value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Contraseña
              </div>
              <input className={ui.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Nombre completo
              </div>
              <input className={ui.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Rol
              </div>
              <select className={ui.input} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="chief">Jefe de Operadores</option>
                <option value="operator">Operador</option>
                <option value="producer">Productor</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Programas asignados
              </div>
              <div className={ui.card} style={{ padding: 10 }}>
                {programsLoading ? (
                  <div className={ui.muted}>Cargando programas…</div>
                ) : !Array.isArray(programs) || programs.length === 0 ? (
                  <div className={ui.muted}>No hay programas.</div>
                ) : (
                  <div className={ui.grid} style={{ gap: 8 }}>
                    {programs.map((p) => (
                      <label key={p.id} className={ui.row} style={{ gridColumn: 'span 6', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={createProgramIds.includes(Number(p.id))}
                          onChange={() => setCreateProgramIds((prev) => toggleId(prev, p.id))}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {submitError ? <div className={ui.muted} style={{ marginTop: 10 }}>{submitError}</div> : null}
        </form>
      </Modal>

      <Modal
        open={showEditUser}
        title={editingUser ? `Editar usuario: ${editingUser.fullName}` : 'Editar usuario'}
        onClose={() => {
          if (editSubmitting) return
          setShowEditUser(false)
        }}
        footer={
          <>
            <button className={ui.button} type="button" onClick={() => setShowEditUser(false)} disabled={editSubmitting}>
              Cancelar
            </button>
            <button className={ui.buttonPrimary} type="submit" form="edit-user" disabled={editSubmitting}>
              Guardar
            </button>
          </>
        }
      >
        <form id="edit-user" onSubmit={onEditUser}>
          <div className={ui.grid}>
            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Rol
              </div>
              <select className={ui.input} value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="chief">Jefe de Operadores</option>
                <option value="operator">Operador</option>
                <option value="producer">Productor</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Programas asignados
              </div>
              <div className={ui.card} style={{ padding: 10 }}>
                {!Array.isArray(programs) || programs.length === 0 ? (
                  <div className={ui.muted}>No hay programas.</div>
                ) : (
                  <div className={ui.grid} style={{ gap: 8 }}>
                    {programs.map((p) => (
                      <label key={p.id} className={ui.row} style={{ gridColumn: 'span 6', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={editProgramIds.includes(Number(p.id))}
                          onChange={() => setEditProgramIds((prev) => toggleId(prev, p.id))}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editError ? <div className={ui.muted} style={{ marginTop: 10 }}>{editError}</div> : null}
        </form>
      </Modal>

      <Modal
        open={showDeleteUser}
        title={deletingUser ? `Eliminar usuario: ${deletingUser.fullName}` : 'Eliminar usuario'}
        onClose={() => {
          if (deleteSubmitting) return
          setShowDeleteUser(false)
        }}
        footer={
          <>
            <button className={ui.button} type="button" onClick={() => setShowDeleteUser(false)} disabled={deleteSubmitting}>
              Cancelar
            </button>
            <button
              className={ui.buttonPrimary}
              type="button"
              onClick={onConfirmDelete}
              disabled={
                deleteSubmitting ||
                (me?.id != null && deletingUser?.id != null && String(me.id) === String(deletingUser.id)) ||
                (deletingUser?.role === 'chief' && chiefCount <= 1)
              }
              title={
                deletingUser?.role === 'chief' && chiefCount <= 1
                  ? 'No podés eliminar el último Jefe de Operadores'
                  : undefined
              }
            >
              Eliminar
            </button>
          </>
        }
      >
        <div className={ui.muted}>
          Esta acción no se puede deshacer.
          {deletingUser?.role === 'chief' && chiefCount <= 1 ? ' No podés eliminar el último Jefe de Operadores.' : ''}
        </div>

        {Array.isArray(programs) && deletingUser?.assignedProgramIds?.length ? (
          <div className={ui.muted} style={{ marginTop: 10 }}>
            Programas asignados:{' '}
            {deletingUser.assignedProgramIds
              .map((id) => programsById.get(String(id))?.name || `#${id}`)
              .join(', ')}
          </div>
        ) : null}

        {deleteError ? <div className={ui.muted} style={{ marginTop: 10 }}>{deleteError}</div> : null}
      </Modal>
    </div>
  )
}
