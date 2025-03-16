"use client"

import { createContext, useState, useEffect, useContext, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

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
      const response = await fetch("http://localhost:5000/api/check-auth", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.authenticated) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Login failed")
      }

      const data = await response.json()
      setUser(data.user)
      return data.user
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Registration failed")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Registration error in context:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear user state, even if server request fails
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

