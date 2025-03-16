"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./Cart.css"

const Cart = () => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/cart", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }

      const data = await response.json()
      setCartItems(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      setError(error.message || "Error fetching cart")
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }))

      const response = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update cart")
      }

      // Refresh cart
      fetchCart()
    } catch (error) {
      setError(error.message || "Error updating cart")
      console.error("Error updating cart:", error)
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const removeItem = async (itemId) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }))

      const response = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      // Refresh cart
      fetchCart()
    } catch (error) {
      setError(error.message || "Error removing item")
      console.error("Error removing item:", error)
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="page-header">
          <h1>Your Cart</h1>
          <p>Review your selected items</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading cart...</div>
        ) : cartItems.length > 0 ? (
          <div className="cart-container">
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.product.image ? (
                      <img src={`http://localhost:5000${item.product.image}`} alt={item.product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3>{item.product.name}</h3>
                    <p className="item-seller">from {item.seller.storeName}</p>
                    <p className="item-price">${item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="item-quantity">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating[item.id] || item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating[item.id]}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-subtotal">
                    <p>${item.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="item-actions">
                    <button className="remove-btn" onClick={() => removeItem(item.id)} disabled={updating[item.id]}>
                      {updating[item.id] ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>$2.99</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>${(total + 2.99).toFixed(2)}</span>
              </div>
              <button className="btn btn-primary checkout-btn">Proceed to Checkout</button>
            </div>
          </div>
        ) : (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/student/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart

