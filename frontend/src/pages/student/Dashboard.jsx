"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./Dashboard.css"

const StudentDashboard = () => {
  const { user } = useAuth()
  const [recentStores, setRecentStores] = useState([])
  const [recentProducts, setRecentProducts] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchData()
    // Set current time for greeting
    setCurrentTime(new Date())
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch recent stores
      const storesResponse = await fetch("https://grocto-backend.onrender.com/api/stores?limit=3", {
        credentials: "include",
      })
      const storesData = await storesResponse.json()

      // Fetch recent products
      const productsResponse = await fetch("https://grocto-backend.onrender.com/api/products?limit=4", {
        credentials: "include",
      })
      const productsData = await productsResponse.json()

      // Fetch cart items
      const cartResponse = await fetch("https://grocto-backend.onrender.com/api/cart", {
        credentials: "include",
      })
      const cartData = await cartResponse.json()

      setRecentStores(storesData.stores || [])
      setRecentProducts(productsData.products || [])
      setCartItems(cartData.items || [])
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
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1>
              {getGreeting()}, {user?.name}!
            </h1>
            <p>Welcome to Grocto - your college grocery delivery service</p>
            <div className="welcome-actions">
              <Link to="/student/products" className="btn btn-primary">
                Browse Products
              </Link>
              <Link to="/student/stores" className="btn btn-outline">
                Find Stores
              </Link>
            </div>
          </div>
          <div className="welcome-image">
            <img
              src="/groceries-illustration.svg"
              alt="Groceries"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=200&width=200"
              }}
            />
          </div>
        </div>

        {/* Cart Summary Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Cart</h2>
            <Link to="/student/cart" className="view-all">
              View Cart
            </Link>
          </div>

          {loading ? (
            <div className="loading">Loading cart...</div>
          ) : cartItems.length > 0 ? (
            <div className="cart-summary-dashboard">
              <div className="cart-items-preview">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="cart-item-preview">
                    <div className="item-preview-image">
                      <ImageWithFallback
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        height={60}
                        width={60}
                        fallbackSrc="/placeholder.svg?height=60&width=60"
                      />
                    </div>
                    <div className="item-preview-details">
                      <h3>{item.product.name}</h3>
                      <p>
                        ₹{item.product.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
                {cartItems.length > 3 && <div className="more-items">+{cartItems.length - 3} more items</div>}
              </div>
              <Link to="/student/cart" className="btn btn-primary">
                Checkout
              </Link>
            </div>
          ) : (
            <div className="empty-section">
              <p>Your cart is empty. Start shopping now!</p>
              <Link to="/student/products" className="btn btn-outline">
                Browse Products
              </Link>
            </div>
          )}
        </div>

        {/* Popular Stores Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Popular Stores</h2>
            <Link to="/student/stores" className="view-all">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="loading">Loading stores...</div>
          ) : recentStores.length > 0 ? (
            <div className="stores-grid">
              {recentStores.map((store) => (
                <Link to={`/student/store/${store.id}`} key={store.id} className="store-card">
                  <div className="store-details">
                    <h3>{store.name}</h3>
                    <p className="store-address">{store.address}</p>
                    <div className="store-info">
                      <span className="store-hours">
                        {store.openingTime} - {store.closingTime}
                      </span>
                      <span className="store-days">{store.workingDays}</span>
                    </div>
                    <div className="store-products-count">{store.productsCount} Products</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-section">No stores available yet.</div>
          )}
        </div>

        {/* Recent Products Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Featured Products</h2>
            <Link to="/student/products" className="view-all">
              Browse All
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
                      height={200}
                      width={200}
                      fallbackSrc="/placeholder.svg?height=200&width=200"
                    />
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p className="product-seller">by {product.seller.storeName}</p>
                    <p className="product-price">₹{product.price.toFixed(2)}</p>
                    <Link to={`/student/store/${product.seller.id}`} className="btn btn-outline">
                      View Store
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section">No products available yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

