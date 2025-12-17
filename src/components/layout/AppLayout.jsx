import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import styles from './layout.module.css'
import GlobalAudioPlayer from '../player/GlobalAudioPlayer'

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>

      <GlobalAudioPlayer />
    </div>
  )
}
