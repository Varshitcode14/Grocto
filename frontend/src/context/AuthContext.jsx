"use client"

import { createContext, useState, useEffect, useContext, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { api } from "../utils/api"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const previousPathRef = useRef(null)
  const isAuthenticatedRef = useRef(false)

  // Track previous path and authentication state
  useEffect(() => {
    // If user was previously authenticated and now on landing page, log them out
    if (isAuthenticatedRef.current && location.pathname === "/" && previousPathRef.current !== "/") {
      console.log("Detected back navigation to landing page after login, logging out")
      logout()
    }

    // Update previous path
    previousPathRef.current = location.pathname
    // Update authentication state reference
    isAuthenticatedRef.current = !!user
  }, [location.pathname, user])

  // Initial auth check
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const data = await api.get("/api/check-auth")

      if (data.authenticated) {
        setUser(data.user)
        // Store user data in localStorage as a backup
        localStorage.setItem("user", JSON.stringify(data.user))
      } else {
        // Try to get user from localStorage if session is not available
        const storedUser = localStorage.getItem("user")
        if (storedUser && api.getAuthToken()) {
          setUser(JSON.parse(storedUser))
        } else {
          setUser(null)
          localStorage.removeItem("user")
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
      // Try to get user from localStorage if session check fails
      const storedUser = localStorage.getItem("user")
      if (storedUser && api.getAuthToken()) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser(null)
        localStorage.removeItem("user")
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const data = await api.post("/api/login", { email, password })
      setUser(data.user)
      // Store user data in localStorage as a backup
      localStorage.setItem("user", JSON.stringify(data.user))
      return data.user
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const data = await api.post("/api/register", userData)
      return data
    } catch (error) {
      console.error("Registration error in context:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.post("/api/logout", {})
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear user state and tokens, even if server request fails
      setUser(null)
      localStorage.removeItem("user")
      api.removeAuthToken()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

