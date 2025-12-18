import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiActivity, FiHeadphones, FiLayers, FiLock, FiRadio, FiShield } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import styles from './login.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = useMemo(() => location.state?.from?.pathname || '/dashboard', [location])

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login({ username, password })
      if (!result.ok) {
        setError('Credenciales inválidas')
        return
      }
      navigate(from, { replace: true })
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <FiRadio />
            </div>
            <div>
              <div className={styles.brandName}>RadioPad</div>
              <div className={styles.brandSub}>FX Management para emisoras</div>
            </div>
          </div>

          <div className={styles.title}>Control de FX con acceso por roles</div>
          <div className={styles.hint}>
            Operación rápida, biblioteca institucional y colecciones personales.
          </div>

          <div className={styles.featuresTitle}>Incluye</div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureName}>
                <FiShield /> Roles y permisos
              </div>
              <div className={styles.featureDesc}>
                Jefe, Operador y Productor con accesos diferenciados.
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureName}>
                <FiLayers /> Programas
              </div>
              <div className={styles.featureDesc}>
                FX dedicados por programa y asignación controlada.
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureName}>
                <FiHeadphones /> Pad de efectos
              </div>
              <div className={styles.featureDesc}>
                Disparo con un clic y enfoque operativo.
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureName}>
                <FiActivity /> Biblioteca
              </div>
              <div className={styles.featureDesc}>
                Institucional + personal (colecciones del operador).
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.title}>Iniciar sesión</div>
          <div className={styles.hint}>Ingresá con tus credenciales.</div>

          <form onSubmit={onSubmit} className={styles.form}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="tu-email@dominio.com"
              />
            </label>

            <label className={styles.label}>
              Contraseña
              <input
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.button} type="submit" disabled={loading}>
              <FiLock />
              {loading ? 'Ingresando…' : 'Entrar'}
            </button>

            <div className={styles.demo}>
              <div className={styles.demoTitle}>Cuentas demo</div>
              <div className={styles.demoLine}>admin / admin (Jefe)</div>
              <div className={styles.demoLine}>operador / 1234 (Operador)</div>
              <div className={styles.demoLine}>productor / 1234 (Productor)</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
