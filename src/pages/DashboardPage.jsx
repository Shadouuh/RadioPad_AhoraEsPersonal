import { useMemo } from 'react'
import { FiActivity, FiBarChart2, FiHeadphones, FiLayers, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getPrograms } from '../services/programService'
import { getSounds } from '../services/soundService'
import { getUsers } from '../services/userService'
import { useApiList } from '../hooks/useApiList'
import ui from '../components/ui/ui.module.css'

function safePlayCount(sound) {
  const v = sound?.playCount
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export default function DashboardPage() {
  const { user } = useAuth()

  const programsQuery = useApiList(getPrograms)
  const soundsQuery = useApiList(getSounds)
  const usersQuery = useApiList(getUsers)

  const assignedProgramsCount = useMemo(() => {
    if (!user) return 0
    if (Array.isArray(user.assignedProgramIds) && user.assignedProgramIds.length > 0) {
      return user.assignedProgramIds.length
    }
    return programsQuery.data.length
  }, [user, programsQuery.data.length])

  const visibleSounds = useMemo(() => {
    if (!user) return []
    if (!Array.isArray(soundsQuery.data)) return []

    if (user.role === 'chief') return soundsQuery.data

    const allowedPrograms = Array.isArray(user.assignedProgramIds) ? user.assignedProgramIds : []

    return soundsQuery.data.filter((s) => {
      if (s.scope === 'institutional') return true
      if (s.scope === 'personal') return s.ownerUserId === user.id
      if (s.scope === 'program') return allowedPrograms.includes(s.programId)
      return false
    })
  }, [soundsQuery.data, user])

  const totalPlays = useMemo(() => {
    return visibleSounds.reduce((acc, s) => acc + safePlayCount(s), 0)
  }, [visibleSounds])

  const topSounds = useMemo(() => {
    const list = [...visibleSounds]
    list.sort((a, b) => safePlayCount(b) - safePlayCount(a))
    return list.slice(0, 10)
  }, [visibleSounds])

  const maxTopPlays = useMemo(() => {
    return topSounds.reduce((m, s) => Math.max(m, safePlayCount(s)), 0)
  }, [topSounds])

  const scopeCounts = useMemo(() => {
    const base = { institutional: 0, program: 0, personal: 0 }
    visibleSounds.forEach((s) => {
      if (s.scope === 'institutional') base.institutional += 1
      if (s.scope === 'program') base.program += 1
      if (s.scope === 'personal') base.personal += 1
    })
    return base
  }, [visibleSounds])

  const mostPlayed = useMemo(() => {
    if (topSounds.length === 0) return null
    return topSounds[0]
  }, [topSounds])

  const rolePermissions = useMemo(
    () => [
      {
        permission: 'Ver Dashboard',
        chief: true,
        operator: true,
        producer: true,
      },
      {
        permission: 'Disparar FX (Play/Pause)',
        chief: true,
        operator: true,
        producer: true,
      },
      {
        permission: 'Crear FX institucionales',
        chief: true,
        operator: false,
        producer: false,
      },
      {
        permission: 'Crear FX personales',
        chief: true,
        operator: true,
        producer: false,
      },
      {
        permission: 'Asignar FX a programas',
        chief: true,
        operator: true,
        producer: false,
      },
      {
        permission: 'Crear programas',
        chief: true,
        operator: false,
        producer: false,
      },
      {
        permission: 'Administrar usuarios (alta/baja/asignación)',
        chief: true,
        operator: false,
        producer: false,
      },
      {
        permission: 'Ver todo (sin filtro por asignación)',
        chief: true,
        operator: false,
        producer: false,
      },
      {
        permission: 'Ver solo asignados',
        chief: false,
        operator: true,
        producer: true,
      },
    ],
    [],
  )

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Panel general</h1>
          <div className={ui.sub}>Estado rápido del sistema y accesos según tu rol.</div>
        </div>
      </div>

      <div className={ui.grid}>
        <div className={ui.card} style={{ gridColumn: 'span 3' }}>
          <div className={ui.cardTitle}>
            <FiLayers /> Programas
          </div>
          <div className={ui.kpi}>{assignedProgramsCount}</div>
          <div className={ui.kpiHint}>Asignados / visibles</div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 3' }}>
          <div className={ui.cardTitle}>
            <FiHeadphones /> FX
          </div>
          <div className={ui.kpi}>{visibleSounds.length}</div>
          <div className={ui.kpiHint}>Visibles según tu rol</div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 3' }}>
          <div className={ui.cardTitle}>
            <FiTrendingUp /> Reproducciones
          </div>
          <div className={ui.kpi}>{totalPlays}</div>
          <div className={ui.kpiHint}>Total acumulado (playCount)</div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 3' }}>
          <div className={ui.cardTitle}>
            <FiUsers /> Usuarios
          </div>
          <div className={ui.kpi}>{usersQuery.data.length}</div>
          <div className={ui.kpiHint}>Cuentas registradas</div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 3' }}>
          <div className={ui.cardTitle}>
            <FiActivity /> Backend
          </div>
          <div className={ui.kpi}>
            {programsQuery.error || soundsQuery.error || usersQuery.error ? 'OFF' : 'ON'}
          </div>
          <div className={ui.kpiHint}>JSON Server</div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 9' }}>
          <div className={ui.cardTitle}>
            <FiBarChart2 /> Top sonidos por reproducciones
          </div>

          {topSounds.length === 0 ? (
            <div className={ui.muted}>Todavía no hay datos de reproducciones.</div>
          ) : (
            <div className={ui.grid} style={{ gap: 10 }}>
              <div className={ui.card} style={{ gridColumn: 'span 5' }}>
                <div className={ui.cardTitle}>Más reproducido</div>
                <div className={ui.kpi}>{safePlayCount(mostPlayed)}</div>
                <div className={ui.kpiHint}>{mostPlayed?.name || '—'}</div>

                <div style={{ marginTop: 10 }}>
                  <div className={ui.muted} style={{ marginBottom: 6 }}>
                    Distribución por tipo
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={ui.badge}>institutional</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--hover)' }}>
                        <div
                          style={{
                            width: `${Math.round(clamp01(scopeCounts.institutional / Math.max(1, visibleSounds.length)) * 100)}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: 'var(--accent)',
                          }}
                        />
                      </div>
                      <span className={ui.muted}>{scopeCounts.institutional}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={ui.badge}>program</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--hover)' }}>
                        <div
                          style={{
                            width: `${Math.round(clamp01(scopeCounts.program / Math.max(1, visibleSounds.length)) * 100)}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: 'var(--accent)',
                          }}
                        />
                      </div>
                      <span className={ui.muted}>{scopeCounts.program}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={ui.badge}>personal</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--hover)' }}>
                        <div
                          style={{
                            width: `${Math.round(clamp01(scopeCounts.personal / Math.max(1, visibleSounds.length)) * 100)}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: 'var(--accent)',
                          }}
                        />
                      </div>
                      <span className={ui.muted}>{scopeCounts.personal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={ui.card} style={{ gridColumn: 'span 7' }}>
                <div className={ui.cardTitle}>Ranking</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {topSounds.map((s, idx) => {
                    const plays = safePlayCount(s)
                    const pct = maxTopPlays > 0 ? Math.round((plays / maxTopPlays) * 100) : 0
                    return (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 56px', gap: 10, alignItems: 'center' }}>
                        <span className={ui.badge}>#{idx + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name}
                          </div>
                          <div style={{ height: 8, borderRadius: 999, background: 'var(--hover)', marginTop: 6 }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'var(--accent)' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900 }}>{plays}</div>
                          <div className={ui.muted} style={{ fontSize: 11 }}>
                            plays
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 12' }}>
          <div className={ui.cardTitle}>Permisos por rol</div>

          <div className={ui.muted} style={{ marginBottom: 10 }}>
            Tabla comparativa basada en el comportamiento actual de la app.
          </div>

          <table className={ui.table}>
            <thead>
              <tr>
                <th>Permiso</th>
                <th>Jefe</th>
                <th>Operador</th>
                <th>Productor</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((r) => (
                <tr key={r.permission}>
                  <td>{r.permission}</td>
                  <td>{r.chief ? 'Sí' : '—'}</td>
                  <td>{r.operator ? 'Sí' : '—'}</td>
                  <td>{r.producer ? 'Sí' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
