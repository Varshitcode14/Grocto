"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import NotificationCenter from "./NotificationCenter"
import "./Navbar.css"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout, checkAuthStatus } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Force auth check on every render and location change
  useEffect(() => {
    checkAuthStatus()
  }, [location.pathname])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  // Determine home link based on user role
  const getHomeLink = () => {
    if (!user) return "/"
    if (user.role === "student") return "/student"
    if (user.role === "seller") return "/seller"
    return "/"
  }

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to={getHomeLink()} className="navbar-logo">
          <img src="/grocto-logo.svg" alt="Grocto" className="logo-image" />
          <span className="logo-text">Grocto</span>
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>

        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <Link to={getHomeLink()} className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </li>

          {!user ? (
            // Not logged in
            <>
              <li className="nav-item">
                <Link to="/#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Features
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/#how-it-works" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  How It Works
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/signin" className="nav-link btn btn-outline" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/signup" className="nav-link btn btn-primary" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </li>
            </>
          ) : user.role === "student" ? (
            // Student is logged in
            <>
              <li className="nav-item">
                <Link to="/student/products" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Products
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/student/stores" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Stores
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/student/orders" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Orders
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/student/cart" className="nav-link cart-link" onClick={() => setIsMenuOpen(false)}>
                  <i className="fas fa-shopping-cart"></i>
                  <span>Cart</span>
                </Link>
              </li>
              <li className="nav-item">
                <NotificationCenter />
              </li>
              <li className="nav-item">
                <span className="nav-link user-name">Hi, {user.name}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link btn btn-outline">
                  Logout
                </button>
              </li>
            </>
          ) : (
            // Seller is logged in
            <>
              <li className="nav-item">
                <Link to="/seller/inventory" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Inventory
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/seller/delivery-slots" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Delivery Slots
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/seller/orders" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Orders
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/seller/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
              </li>
              <li className="nav-item">
                <NotificationCenter />
              </li>
              <li className="nav-item">
                <span className="nav-link user-name">Hi, {user.name}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link btn btn-outline">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar

