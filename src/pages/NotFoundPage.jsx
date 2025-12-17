import { Link } from 'react-router-dom'
import ui from '../components/ui/ui.module.css'

export default function NotFoundPage() {
  return (
    <div className={ui.card}>
      <div className={ui.cardTitle}>Página no encontrada</div>
      <div className={ui.muted} style={{ marginBottom: 10 }}>
        La ruta no existe.
      </div>
      <Link to="/dashboard">Ir al dashboard</Link>
    </div>
  )
}
