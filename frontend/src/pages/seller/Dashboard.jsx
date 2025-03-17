"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./Dashboard.css"

const SellerDashboard = () => {
  const { user } = useAuth()
  const [productStats, setProductStats] = useState({
    total: 0,
    inStock: 0,
    outOfStock: 0,
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchDashboardData()
    // Set current time for greeting
    setCurrentTime(new Date())
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch products for stats and recent products
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

      // Set recent products (last 4)
      setRecentProducts(products.slice(0, 4))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="welcome-banner seller-welcome">
          <div className="welcome-content">
            <h1>
              {getGreeting()}, {user?.name}!
            </h1>
            <p>Welcome to your Grocto Seller Dashboard</p>
            <div className="welcome-actions">
              <Link to="/seller/add-product" className="btn btn-primary">
                Add New Product
              </Link>
              <Link to="/seller/inventory" className="btn btn-outline">
                Manage Inventory
              </Link>
            </div>
          </div>
          <div className="welcome-image">
            <img
              src="/store-illustration.svg"
              alt="Store Management"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=200&width=200"
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
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

            <Link to="/seller/offers" className="dashboard-action-card">
              <div className="action-icon">
                <i className="fas fa-tag"></i>
              </div>
              <h3>Manage Offers</h3>
              <p>Create and manage special offers</p>
            </Link>

            <Link to="/seller/delivery-slots" className="dashboard-action-card">
              <div className="action-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Delivery Slots</h3>
              <p>Manage delivery time slots and pricing</p>
            </Link>

            <Link to="/seller/profile" className="dashboard-action-card">
              <div className="action-icon">
                <i className="fas fa-user-cog"></i>
              </div>
              <h3>Profile Settings</h3>
              <p>Update your store information and settings</p>
            </Link>
          </div>
        </div>

        {/* Recent Products */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Products</h2>
            <Link to="/seller/inventory" className="view-all">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : recentProducts.length > 0 ? (
            <div className="product-grid">
              {recentProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <ImageWithFallback
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      height={180}
                      width={180}
                      fallbackSrc="/placeholder.svg?height=180&width=180"
                    />
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p className="product-price">₹{product.price.toFixed(2)}</p>
                    <p className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </p>
                    <Link to={`/seller/edit-product/${product.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>You haven't added any products yet.</p>
              <Link to="/seller/add-product" className="btn btn-primary">
                Add Your First Product
              </Link>
            </div>
          )}
        </div>

        {/* Store Information */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Store Information</h2>
            <Link to="/seller/profile" className="view-all">
              Edit
            </Link>
          </div>
          <div className="store-info">
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard

