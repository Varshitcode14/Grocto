"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/signin" />
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

  return children
}

export default ProtectedRoute

