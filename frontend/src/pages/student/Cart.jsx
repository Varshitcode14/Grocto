"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "../../context/ModalContext"
import "./Cart.css"

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showError, showSuccess } = useModal()
  const [cartItems, setCartItems] = useState([])
  const [store, setStore] = useState(null)
  const [summary, setSummary] = useState({
    subtotal: 0,
    gstAmount: 0,
    deliveryFee: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/cart", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }

      const data = await response.json()
      setCartItems(data.items || [])
      setStore(data.store || null)
      setSummary(
        data.summary || {
          subtotal: 0,
          gstAmount: 0,
          deliveryFee: 0,
          total: 0,
        },
      )
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

      const response = await fetch(`https://grocto-backend.onrender.com/api/cart/${itemId}`, {
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
      showSuccess("Cart Updated", "Item quantity has been updated successfully")
    } catch (error) {
      showError("Update Failed", error.message || "Error updating cart")
      console.error("Error updating cart:", error)
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const removeItem = async (itemId) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }))

      const response = await fetch(`https://grocto-backend.onrender.com/api/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      // Refresh cart
      fetchCart()
      showSuccess("Item Removed", "Item has been removed from your cart")
    } catch (error) {
      showError("Remove Failed", error.message || "Error removing item")
      console.error("Error removing item:", error)
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const handleCheckout = () => {
    navigate("/student/checkout")
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="page-header">
          <h1>Your Cart</h1>
          <p>Review your selected items</p>
        </div>

        {loading ? (
          <div className="loading">Loading cart...</div>
        ) : cartItems.length > 0 ? (
          <div className="cart-container">
            {store && (
              <div className="cart-store-info">
                <h3>Shopping from: {store.name}</h3>
                <Link to={`/student/store/${store.id}`} className="btn btn-outline btn-sm">
                  Continue Shopping
                </Link>
              </div>
            )}

            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.product.image ? (
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=100&width=100"
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3>{item.product.name}</h3>
                    <p className="item-price">
                      {item.discount ? (
                        <>
                          <span className="original-price">₹{item.product.price.toFixed(2)}</span>
                          <span className="discounted-price">₹{item.discountedPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <>₹{item.product.price.toFixed(2)}</>
                      )}
                    </p>
                    {item.appliedOffer && (
                      <div className="applied-offer">
                        <span className="offer-tag">OFFER</span>
                        <span className="offer-title">{item.appliedOffer.title}</span>
                        <span className="offer-discount">
                          {item.appliedOffer.discountType === "percentage"
                            ? `${item.appliedOffer.amount}% OFF`
                            : `₹${item.appliedOffer.amount} OFF`}
                        </span>
                      </div>
                    )}
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
                    {item.discount ? (
                      <>
                        <p className="original-subtotal">₹{item.originalSubtotal.toFixed(2)}</p>
                        <p>₹{item.subtotal.toFixed(2)}</p>
                      </>
                    ) : (
                      <p>₹{item.subtotal.toFixed(2)}</p>
                    )}
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
              {summary.totalDiscount > 0 && (
                <div className="summary-row">
                  <span>Original Subtotal</span>
                  <span>₹{summary.originalSubtotal.toFixed(2)}</span>
                </div>
              )}
              {summary.totalDiscount > 0 && (
                <div className="summary-row discount-row">
                  <span>Discount</span>
                  <span>-₹{summary.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{summary.subtotal.toFixed(2)}</span>
              </div>
              {summary.gstAmount > 0 && (
                <div className="summary-row">
                  <span>GST ({store.gstPercentage}%)</span>
                  <span>₹{summary.gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>₹{summary.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>₹{summary.total.toFixed(2)}</span>
              </div>
              <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/student/stores" className="btn btn-primary">
              Browse Stores
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart

