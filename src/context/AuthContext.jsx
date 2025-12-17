import { createContext, useCallback, useContext, useMemo } from 'react'
import { loginWithPassword } from '../services/authService'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('radiopad_user', null)

  const login = useCallback(
    async ({ username, password }) => {
      const found = await loginWithPassword({ username, password })
      if (!found) {
        return { ok: false }
      }
      setUser({
        id: found.id,
        username: found.username,
        fullName: found.fullName,
        role: found.role,
        assignedProgramIds: found.assignedProgramIds || [],
      })
      return { ok: true }
    },
    [setUser],
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [setUser])

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
