import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as apiLogin, register as apiRegister } from '../api/auth'
import {
  clearAuth,
  getStoredUser,
  getToken,
  type StoredUser,
} from '../api/client'

type AuthContextValue = {
  user: StoredUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    name: string
    email: string
    password: string
    phone: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => {
    if (!getToken()) return null
    return getStoredUser() ?? { id: '', name: 'Você' }
  })

  const login = useCallback(async (email: string, password: string) => {
    const next = await apiLogin(email, password)
    setUser(next)
  }, [])

  const register = useCallback(
    async (input: {
      name: string
      email: string
      password: string
      phone: string
    }) => {
      const next = await apiRegister(input)
      setUser(next)
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
