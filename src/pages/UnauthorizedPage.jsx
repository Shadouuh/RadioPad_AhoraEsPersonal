import { Link } from 'react-router-dom'
import ui from '../components/ui/ui.module.css'

export default function UnauthorizedPage() {
  return (
    <div className={ui.card}>
      <div className={ui.cardTitle}>Acceso denegado</div>
      <div className={ui.muted} style={{ marginBottom: 10 }}>
        Tu rol no tiene permisos para esta sección.
      </div>
      <Link to="/dashboard">Volver al dashboard</Link>
    </div>
  )
}
