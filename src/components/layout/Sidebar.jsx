import { NavLink } from 'react-router-dom'
import {
  FiGrid,
  FiHeadphones,
  FiLayers,
  FiRadio,
  FiSettings,
  FiUsers,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/roles'
import styles from './layout.module.css'

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.sideItem} ${isActive ? styles.sideItemActive : ''}`
      }
      end
    >
      <Icon className={styles.sideIcon} />
      <span className={styles.sideLabel}>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <FiRadio />
        </div>
        <div className={styles.brandText}>
          <div className={styles.brandName}>RadioPad</div>
          <div className={styles.brandSub}>FX Management</div>
        </div>
      </div>

      <nav className={styles.sideNav}>
        <div className={styles.sideSection}>Principal</div>
        <Item to="/dashboard" icon={FiGrid} label="Dashboard" />
        <Item to="/fx" icon={FiHeadphones} label="Efectos" />
        <Item to="/programas" icon={FiLayers} label="Programas" />
        <Item to="/configuracion" icon={FiSettings} label="Configuración" />

        {user?.role === ROLES.CHIEF ? (
          <>
            <div className={styles.sideSection}>Administración</div>
            <Item to="/usuarios" icon={FiUsers} label="Usuarios" />
          </>
        ) : null}
      </nav>

      <div className={styles.sideFooter}>
        <div className={styles.sideFooterCard}>
          <FiRadio />
          <div>
            <div className={styles.sideFooterTitle}>Modo Operación</div>
            <div className={styles.sideFooterHint}>Listo para disparar FX</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
