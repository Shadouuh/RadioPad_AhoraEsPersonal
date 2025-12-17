import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiLogOut, FiSearch } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../utils/roles'
import styles from './layout.module.css'

const TITLES = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/fx': 'Efectos',
  '/programas': 'Programas',
  '/configuracion': 'Configuración',
  '/usuarios': 'Usuarios',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const title = useMemo(() => {
    const key = Object.keys(TITLES).find((k) => location.pathname === k)
    return key ? TITLES[key] : 'RadioPad'
  }, [location.pathname])

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <div className={styles.pageTitle}>{title}</div>
        <div className={styles.search}>
          <FiSearch />
          <input placeholder="Buscar…" aria-label="Buscar" />
        </div>
      </div>

      <div className={styles.navbarRight}>
        <div className={styles.userChip}>
          <div className={styles.userName}>{user?.fullName || user?.username}</div>
          <div className={styles.userRole}>{ROLE_LABELS[user?.role] || user?.role}</div>
        </div>

        <button
          className={styles.iconButton}
          onClick={() => {
            logout()
            navigate('/login')
          }}
          type="button"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <FiLogOut />
        </button>
      </div>
    </header>
  )
}
