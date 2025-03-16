"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./Dashboard.css"

const StudentDashboard = () => {
  const { user } = useAuth()
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products?limit=4", {
          credentials: "include",
        })
        const data = await response.json()
        setRecentProducts(data.products || [])
      } catch (error) {
        console.error("Error fetching recent products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentProducts()
  }, [])

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}!</h1>
          <p>Browse and order groceries from local stores.</p>
        </div>

        <div className="dashboard-actions">
          <Link to="/student/products" className="dashboard-action-card">
            <div className="action-icon">
              <i className="fas fa-shopping-basket"></i>
            </div>
            <h3>Browse Products</h3>
            <p>Explore groceries from various stores</p>
          </Link>

          <Link to="/student/cart" className="dashboard-action-card">
            <div className="action-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h3>View Cart</h3>
            <p>Check your selected items</p>
          </Link>
        </div>

        <div className="recent-products">
          <div className="section-header">
            <h2>Recent Products</h2>
            <Link to="/student/products" className="view-all">
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
                    {product.image ? (
                      <img src={`http://localhost:5000${product.image}`} alt={product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p className="product-seller">by {product.seller.storeName}</p>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <Link to={`/student/products?id=${product.id}`} className="btn btn-outline">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">No products available yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

