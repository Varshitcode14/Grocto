"use client"

import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = ({ children, role }) => {
  const { user, loading, checkAuthStatus } = useAuth()
  const location = useLocation()

  // Re-check auth status when the component mounts or location changes
  useEffect(() => {
    checkAuthStatus()
  }, [location.pathname])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    // Redirect to login and remember where they were trying to go
    return <Navigate to="/signin" state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "student") {
      return <Navigate to="/student" />
    } else if (user.role === "seller") {
      return <Navigate to="/seller" />
    }
    return <Navigate to="/" />
  }

  // If children is a function, call it with the user
  if (typeof children === "function") {
    return children({ user })
  }

  return children
}

export default ProtectedRoute

