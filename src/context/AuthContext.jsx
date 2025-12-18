import { createContext, useCallback, useContext, useMemo } from 'react'
import { authenticateUser } from '../services/userSupabase'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('radiopad_user', null)

  const buildUser = useCallback((userData) => {
    return {
      id: userData.id,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role,
      assignedProgramIds: userData.assignedProgramIds || [],
    }
  }, [])

  const login = useCallback(
    async ({ username, password }) => {
      try {
        const userData = await authenticateUser(username, password)
        if (!userData) {
          return { ok: false, error: 'Usuario o contraseña incorrectos' }
        }
        setUser(buildUser(userData))
        return { ok: true }
      } catch (error) {
        console.error('[AuthContext] Login error:', error)
        return { ok: false, error: error.message || 'Error al iniciar sesión' }
      }
    },
    [setUser, buildUser],
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [setUser])

  // No necesitamos useEffect porque la sesión se guarda en localStorage

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
