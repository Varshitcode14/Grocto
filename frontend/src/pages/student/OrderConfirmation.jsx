"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./OrderConfirmation.css"

const OrderConfirmation = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch order details")
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      setError(error.message || "Error fetching order details")
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="order-confirmation-page">
      <div className="container">
        <div className="page-header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading order details...</div>
        ) : order ? (
          <div className="confirmation-container">
            <div className="confirmation-header">
              <div className="order-status">
                <div className={`status-badge ${order.status}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <h2>Order #{order.id}</h2>
                <p className="order-date">Placed on {formatDate(order.orderDate)}</p>
              </div>

              <div className="confirmation-actions">
                <Link to="/student/orders" className="btn btn-outline">
                  View All Orders
                </Link>
                <Link to="/student" className="btn btn-primary">
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="confirmation-details">
              <div className="confirmation-section">
                <h3>Order Details</h3>
                <div className="detail-row">
                  <span className="detail-label">Store:</span>
                  <span className="detail-value">{order.store.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Delivery Address:</span>
                  <span className="detail-value">{order.deliveryAddress}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Delivery Time:</span>
                  <span className="detail-value">
                    {formatTime(order.deliveryStartTime)} - {formatTime(order.deliveryEndTime)}
                  </span>
                </div>
                {order.estimatedDeliveryTime && (
                  <div className="detail-row">
                    <span className="detail-label">Estimated Delivery:</span>
                    <span className="detail-value">{formatDate(order.estimatedDeliveryTime)}</span>
                  </div>
                )}
              </div>

              <div className="confirmation-section">
                <h3>Order Items</h3>
                <div className="order-items-list">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="item-image">
                        <ImageWithFallback
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productName}
                          height={60}
                          width={60}
                          fallbackSrc="/placeholder.svg?height=60&width=60"
                        />
                      </div>
                      <div className="item-details">
                        <h4>{item.productName}</h4>
                        <div className="item-price-qty">
                          <span>
                            ₹{item.productPrice.toFixed(2)} × {item.quantity}
                          </span>
                          <span>₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="confirmation-section">
                <h3>Payment Summary</h3>
                <div className="price-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee.toFixed(2)}</span>
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {order.deliveryPersonContact && order.status === "delivering" && (
              <div className="confirmation-section">
                <h3>Delivery Person</h3>
                <div className="detail-row">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value delivery-person-contact">{order.deliveryPersonContact}</span>
                </div>
              </div>
            )}

            <div className="order-tracking">
              <h3>Order Status</h3>
              <div className="tracking-timeline">
                <div
                  className={`timeline-step ${order.status === "pending" || order.status === "accepted" || order.status === "packaging" || order.status === "delivering" || order.status === "delivered" ? "active" : ""}`}
                >
                  <div className="step-icon">1</div>
                  <div className="step-label">Order Placed</div>
                </div>
                <div
                  className={`timeline-step ${order.status === "accepted" || order.status === "packaging" || order.status === "delivering" || order.status === "delivered" ? "active" : ""}`}
                >
                  <div className="step-icon">2</div>
                  <div className="step-label">Order Accepted</div>
                </div>
                <div
                  className={`timeline-step ${order.status === "packaging" || order.status === "delivering" || order.status === "delivered" ? "active" : ""}`}
                >
                  <div className="step-icon">3</div>
                  <div className="step-label">Packaging</div>
                </div>
                <div
                  className={`timeline-step ${order.status === "delivering" || order.status === "delivered" ? "active" : ""}`}
                >
                  <div className="step-icon">4</div>
                  <div className="step-label">On Delivery</div>
                </div>
                <div className={`timeline-step ${order.status === "delivered" ? "active" : ""}`}>
                  <div className="step-icon">5</div>
                  <div className="step-label">Delivered</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="not-found">Order not found</div>
        )}
      </div>
    </div>
  )
}

export default OrderConfirmation

