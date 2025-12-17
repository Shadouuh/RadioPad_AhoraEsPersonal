import ui from '../components/ui/ui.module.css'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { settings, setSettings, accents, backgrounds, patterns } = useTheme()

  return (
    <div>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.h1}>Configuración</h1>
          <div className={ui.sub}>Personalizá tema, fondo y color de acento.</div>
        </div>
      </div>

      <div className={ui.grid}>
        <div className={ui.card} style={{ gridColumn: 'span 6' }}>
          <div className={ui.cardTitle}>Tema</div>
          <div className={ui.sub} style={{ marginTop: 0, marginBottom: 10 }}>
            Cambiá entre modo claro y oscuro.
          </div>

          <div className={ui.row}>
            <button
              type="button"
              className={`${ui.button} ${settings.mode === 'light' ? ui.buttonPrimary : ''}`}
              onClick={() => setSettings((s) => ({ ...s, mode: 'light' }))}
            >
              Claro
            </button>
            <button
              type="button"
              className={`${ui.button} ${settings.mode === 'dark' ? ui.buttonPrimary : ''}`}
              onClick={() => setSettings((s) => ({ ...s, mode: 'dark' }))}
            >
              Oscuro
            </button>
          </div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 6' }}>
          <div className={ui.cardTitle}>Acento</div>
          <div className={ui.sub} style={{ marginTop: 0, marginBottom: 10 }}>
            Color usado en botones primarios y detalles.
          </div>

          <div className={ui.row} style={{ flexWrap: 'wrap' }}>
            {Object.entries(accents).map(([key, a]) => (
              <button
                key={key}
                type="button"
                className={`${ui.button} ${settings.accent === key ? ui.buttonPrimary : ''}`}
                onClick={() => setSettings((s) => ({ ...s, accent: key }))}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 12' }}>
          <div className={ui.cardTitle}>Fondo</div>
          <div className={ui.sub} style={{ marginTop: 0, marginBottom: 10 }}>
            Elegí un estilo de fondo.
          </div>

          <div className={ui.row} style={{ flexWrap: 'wrap' }}>
            {Object.entries(backgrounds).map(([key, b]) => (
              <button
                key={key}
                type="button"
                className={`${ui.button} ${settings.background === b.value ? ui.buttonPrimary : ''}`}
                onClick={() => setSettings((s) => ({ ...s, background: b.value }))}
              >
                {b.label}
              </button>
            ))}
          </div>

          {settings.background === 'image' ? (
            <div style={{ marginTop: 12 }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                URL de imagen (internet)
              </div>
              <input
                className={ui.input}
                placeholder="https://..."
                value={settings.imageUrl}
                onChange={(e) => setSettings((s) => ({ ...s, imageUrl: e.target.value }))}
              />
            </div>
          ) : null}

          {settings.background === 'solid' ? (
            <div style={{ marginTop: 12 }}>
              <div className={ui.muted} style={{ marginBottom: 6 }}>
                Color sólido (hex)
              </div>
              <input
                className={ui.input}
                placeholder="#f4f5f7"
                value={settings.solidColor}
                onChange={(e) => setSettings((s) => ({ ...s, solidColor: e.target.value }))}
              />
            </div>
          ) : null}
        </div>

        <div className={ui.card} style={{ gridColumn: 'span 12' }}>
          <div className={ui.cardTitle}>Patrón</div>
          <div className={ui.sub} style={{ marginTop: 0, marginBottom: 10 }}>
            Agregá detalles sutiles (puntos, líneas o grid).
          </div>

          <div className={ui.row} style={{ flexWrap: 'wrap' }}>
            {Object.entries(patterns).map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={`${ui.button} ${settings.pattern === p.value ? ui.buttonPrimary : ''}`}
                onClick={() => setSettings((s) => ({ ...s, pattern: p.value }))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
