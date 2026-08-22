// Auth context: holds the logged-in user, exposes login/logout
import { createContext, useContext, useState } from 'react'
import { api, storeSession, clearSession, getStoredUser } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    storeSession(data.token, data.user)
    setUser(data.user)
    return data.user
  }

  async function signup(name, email, password, role) {
    await api('/auth/signup', { method: 'POST', body: { name, email, password, role } })
    return login(email, password)
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
