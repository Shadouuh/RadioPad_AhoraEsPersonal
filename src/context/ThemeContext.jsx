import { createContext, useContext, useEffect, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const ThemeContext = createContext(null)

const ACCENTS = {
  blue: { label: 'Azul', value: '#2563eb', contrast: '#ffffff' },
  orange: { label: 'Naranja', value: '#f97316', contrast: '#0a0a0a' },
  green: { label: 'Verde', value: '#16a34a', contrast: '#ffffff' },
  violet: { label: 'Violeta', value: '#7c3aed', contrast: '#ffffff' },
  rose: { label: 'Rosa', value: '#e11d48', contrast: '#ffffff' },
  graphite: { label: 'Graphite', value: '#111827', contrast: '#ffffff' },
}

const BACKGROUNDS = {
  soft: { label: 'Soft', value: 'soft' },
  solid: { label: 'Sólido', value: 'solid' },
  night: { label: 'Noche', value: 'night' },
  image: { label: 'Imagen', value: 'image' },
}

const PATTERNS = {
  none: { label: 'Sin patrón', value: 'none' },
  dots: { label: 'Puntos', value: 'dots' },
  lines: { label: 'Líneas', value: 'lines' },
  grid: { label: 'Grid', value: 'grid' },
}

function toCssUrl(url) {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  return `url(${JSON.stringify(trimmed)})`
}

function patternCss(mode, pattern) {
  if (!pattern || pattern === 'none') return 'none'

  const ink = mode === 'dark' ? 'rgba(233, 237, 245, 0.07)' : 'rgba(17, 19, 24, 0.06)'
  const ink2 = mode === 'dark' ? 'rgba(233, 237, 245, 0.045)' : 'rgba(17, 19, 24, 0.045)'

  if (pattern === 'dots') {
    return `radial-gradient(${ink} 1px, transparent 1px)`
  }

  if (pattern === 'lines') {
    return `repeating-linear-gradient(45deg, ${ink} 0, ${ink} 1px, transparent 1px, transparent 14px)`
  }

  if (pattern === 'grid') {
    return `linear-gradient(${ink2} 1px, transparent 1px), linear-gradient(90deg, ${ink2} 1px, transparent 1px)`
  }

  return 'none'
}

function patternSize(pattern) {
  if (!pattern || pattern === 'none') return '18px 18px'
  if (pattern === 'dots') return '18px 18px'
  if (pattern === 'lines') return '16px 16px'
  if (pattern === 'grid') return '22px 22px'
  return '18px 18px'
}

function computeTokens({ mode, background, solidColor, imageUrl, pattern }) {
  if (mode === 'dark') {
    const baseBg = '#0b0d12'
    const bg = background === 'solid' && solidColor ? solidColor : baseBg
    const img = background === 'image' ? toCssUrl(imageUrl) : ''

    return {
      '--bg': bg,
      '--surface': '#121621',
      '--surface-2': '#161c2a',
      '--text': '#e9edf5',
      '--muted': 'rgba(233, 237, 245, 0.70)',
      '--line': 'rgba(233, 237, 245, 0.14)',
      '--hover': 'rgba(233, 237, 245, 0.06)',
      '--hover-2': 'rgba(233, 237, 245, 0.10)',
      '--glass-bg': 'rgba(18, 22, 33, 0.62)',
      '--glass-border': 'rgba(233, 237, 245, 0.14)',
      '--shadow': '0 12px 34px rgba(0, 0, 0, 0.35)',
      '--pattern-size': patternSize(pattern),
      '--pattern-bg':
        pattern && pattern !== 'none'
          ? patternCss(mode, pattern)
          : 'none',
      '--body-bg':
        background === 'solid'
          ? 'var(--bg)'
          : background === 'image' && img
            ? `linear-gradient(180deg, rgba(11, 13, 18, 0.55), rgba(11, 13, 18, 0.75)), ${img}, var(--bg)`
            : background === 'night'
              ? 'radial-gradient(1000px 700px at 20% 10%, rgba(37, 99, 235, 0.14), transparent 60%), radial-gradient(900px 650px at 90% 20%, rgba(124, 58, 237, 0.10), transparent 62%), var(--bg)'
              : 'radial-gradient(900px 650px at 10% 10%, rgba(255, 255, 255, 0.06), transparent 60%), radial-gradient(900px 650px at 90% 20%, rgba(255, 255, 255, 0.04), transparent 62%), var(--bg)',
    }
  }

  const baseBg = '#f4f5f7'
  const bg = background === 'solid' && solidColor ? solidColor : baseBg
  const img = background === 'image' ? toCssUrl(imageUrl) : ''

  return {
    '--bg': bg,
    '--surface': '#ffffff',
    '--surface-2': '#f0f2f4',
    '--text': '#111318',
    '--muted': 'rgba(17, 19, 24, 0.62)',
    '--line': 'rgba(17, 19, 24, 0.12)',
    '--hover': 'rgba(17, 19, 24, 0.04)',
    '--hover-2': 'rgba(17, 19, 24, 0.07)',
    '--glass-bg': 'rgba(255, 255, 255, 0.70)',
    '--glass-border': 'rgba(17, 19, 24, 0.12)',
    '--shadow': '0 12px 30px rgba(17, 19, 24, 0.08)',
    '--pattern-size': patternSize(pattern),
    '--pattern-bg':
      pattern && pattern !== 'none'
        ? patternCss(mode, pattern)
        : 'none',
    '--body-bg':
      background === 'solid'
        ? 'var(--bg)'
        : background === 'image' && img
          ? `linear-gradient(180deg, rgba(244, 245, 247, 0.72), rgba(244, 245, 247, 0.88)), ${img}, var(--bg)`
          : background === 'night'
            ? 'radial-gradient(900px 650px at 20% 10%, rgba(37, 99, 235, 0.10), transparent 60%), radial-gradient(900px 650px at 90% 20%, rgba(249, 115, 22, 0.08), transparent 62%), var(--bg)'
            : 'radial-gradient(900px 650px at 10% 10%, rgba(17, 19, 24, 0.06), transparent 60%), radial-gradient(900px 650px at 90% 20%, rgba(17, 19, 24, 0.045), transparent 62%), var(--bg)',
  }
}

export function ThemeProvider({ children }) {
  const [rawSettings, setRawSettings] = useLocalStorage('radiopad_theme', {
    mode: 'light',
    accent: 'blue',
    background: 'soft',
    solidColor: '#f4f5f7',
    imageUrl: '',
    pattern: 'none',
  })

  const settings = useMemo(
    () => ({
      mode: 'light',
      accent: 'blue',
      background: 'soft',
      solidColor: '#f4f5f7',
      imageUrl: '',
      pattern: 'none',
      ...rawSettings,
    }),
    [rawSettings],
  )

  const setSettings = (updater) => {
    setRawSettings((prev) => {
      const mergedPrev = {
        mode: 'light',
        accent: 'blue',
        background: 'soft',
        solidColor: '#f4f5f7',
        imageUrl: '',
        pattern: 'none',
        ...prev,
      }
      return typeof updater === 'function' ? updater(mergedPrev) : updater
    })
  }

  const accent = ACCENTS[settings.accent] || ACCENTS.blue

  useEffect(() => {
    const root = document.documentElement

    const tokens = computeTokens({
      mode: settings.mode,
      background: settings.background,
      solidColor: settings.solidColor,
      imageUrl: settings.imageUrl,
      pattern: settings.pattern,
    })
    Object.entries(tokens).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })

    root.style.setProperty('--accent', accent.value)
    root.style.setProperty('--accent-contrast', accent.contrast)

    root.style.colorScheme = settings.mode

    root.setAttribute('data-theme', settings.mode)
  }, [
    accent.contrast,
    accent.value,
    settings.background,
    settings.imageUrl,
    settings.mode,
    settings.pattern,
    settings.solidColor,
  ])

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      accents: ACCENTS,
      backgrounds: BACKGROUNDS,
      patterns: PATTERNS,
    }),
    [settings],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
