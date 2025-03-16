"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./Dashboard.css"

const SellerDashboard = () => {
  const { user } = useAuth()
  const [productStats, setProductStats] = useState({
    total: 0,
    inStock: 0,
    outOfStock: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products", {
          credentials: "include",
        })
        const data = await response.json()

        const products = data.products || []
        const inStock = products.filter((p) => p.stock > 0).length

        setProductStats({
          total: products.length,
          inStock,
          outOfStock: products.length - inStock,
        })
      } catch (error) {
        console.error("Error fetching product stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductStats()
  }, [])

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your grocery store and inventory.</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="stat-content">
              <h3>Total Products</h3>
              <p className="stat-value">{loading ? "..." : productStats.total}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>In Stock</h3>
              <p className="stat-value">{loading ? "..." : productStats.inStock}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Out of Stock</h3>
              <p className="stat-value">{loading ? "..." : productStats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/seller/add-product" className="dashboard-action-card">
            <div className="action-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <h3>Add New Product</h3>
            <p>Add a new product to your inventory</p>
          </Link>

          <Link to="/seller/inventory" className="dashboard-action-card">
            <div className="action-icon">
              <i className="fas fa-list"></i>
            </div>
            <h3>Manage Inventory</h3>
            <p>View and update your product inventory</p>
          </Link>

          <Link to="/seller/profile" className="dashboard-action-card">
            <div className="action-icon">
              <i className="fas fa-user-cog"></i>
            </div>
            <h3>Profile Settings</h3>
            <p>Update your store information and settings</p>
          </Link>
        </div>

        <div className="store-info">
          <h2>Store Information</h2>
          <div className="store-details">
            <div className="detail-row">
              <span className="detail-label">Store Name:</span>
              <span className="detail-value">{user?.profile?.storeName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{user?.profile?.storeAddress}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{user?.profile?.phoneNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Working Days:</span>
              <span className="detail-value">{user?.profile?.workingDays || "Not set"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Hours:</span>
              <span className="detail-value">
                {user?.profile?.openingTime && user?.profile?.closingTime
                  ? `${user.profile.openingTime} - ${user.profile.closingTime}`
                  : "Not set"}
              </span>
            </div>
          </div>
          <Link to="/seller/profile" className="btn btn-outline">
            Update Store Information
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard

