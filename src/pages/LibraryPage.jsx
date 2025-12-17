import { useMemo, useState } from 'react'
import { FiActivity, FiLayers, FiLock, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getSounds } from '../services/soundService'
import { useApiList } from '../hooks/useApiList'
import ui from '../components/ui/ui.module.css'

const TABS = [
  { id: 'institutional', label: 'Institucional', icon: FiLock },
  { id: 'program', label: 'Por programa', icon: FiLayers },
  { id: 'personal', label: 'Personal', icon: FiUser },
]

export default function LibraryPage() {
  const { user } = useAuth()
  const { data, loading, error } = useApiList(getSounds)
  const [tab, setTab] = useState('institutional')

  const filtered = useMemo(() => {
    if (!user) return []

    if (tab === 'institutional') {
      return data.filter((s) => s.scope === 'institutional')
    }

    if (tab === 'personal') {
      return data.filter((s) => s.scope === 'personal' && s.ownerUserId === user.id)
    }

    const allowedPrograms = Array.isArray(user.assignedProgramIds) ? user.assignedProgramIds : []
    return data.filter((s) => s.scope === 'program' && allowedPrograms.includes(s.programId))
  }, [data, tab, user])

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Biblioteca</h1>
          <div className={ui.sub}>Institucional, por programa y colecciones personales.</div>
        </div>
      </div>

      <div className={ui.card}>
        <div className={ui.row} style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <div className={ui.row}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`${ui.button} ${tab === id ? ui.buttonPrimary : ''}`}
                type="button"
                onClick={() => setTab(id)}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>
          <span className={ui.badge}>
            <FiActivity /> {filtered.length}
          </span>
        </div>

        {loading ? (
          <div className={ui.muted}>Cargando…</div>
        ) : error ? (
          <div className={ui.muted}>No se pudo cargar la lista.</div>
        ) : (
          <div className={ui.list}>
            {filtered.map((s) => (
              <div key={s.id} className={ui.listItem}>
                <div className={ui.listMain}>
                  <div className={ui.listTitle}>{s.name}</div>
                  <div className={ui.listSub}>Ruta: {s.fileUrl ? s.fileUrl : 'sin archivo asignado'}</div>
                </div>
                <div className={ui.listMeta}>
                  <span className={ui.badge}>{s.scope}</span>
                  <span className={ui.badge}>Program: {s.programId ?? '-'}</span>
                  <span className={ui.badge}>ID {s.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
