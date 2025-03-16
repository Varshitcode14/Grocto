"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./OrderDetail.css"

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)

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

  const updateOrderStatus = async (status) => {
    try {
      setUpdating(true)

      const payload = { status }

      // If accepting, set estimated delivery time (2 hours from now)
      if (status === "accepted") {
        const estimatedTime = new Date()
        estimatedTime.setHours(estimatedTime.getHours() + 2)
        payload.estimatedDeliveryTime = estimatedTime.toISOString()
      }

      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      // Refresh order details
      fetchOrderDetails()
    } catch (error) {
      setError(error.message || "Error updating order status")
      console.error("Error updating order status:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAcceptOrder = () => {
    updateOrderStatus("accepted")
  }

  const handleRejectOrder = () => {
    if (window.confirm("Are you sure you want to reject this order?")) {
      updateOrderStatus("rejected")
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

  const getDeliverySlotText = (slot) => {
    switch (slot) {
      case "morning":
        return "Morning (9 AM - 12 PM)"
      case "afternoon":
        return "Afternoon (12 PM - 3 PM)"
      case "evening":
        return "Evening (3 PM - 6 PM)"
      default:
        return slot
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending"
      case "accepted":
        return "status-accepted"
      case "rejected":
        return "status-rejected"
      case "packaging":
        return "status-packaging"
      case "delivering":
        return "status-delivering"
      case "delivered":
        return "status-delivered"
      default:
        return ""
    }
  }

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="page-header">
          <h1>Order Details</h1>
          <p>View and manage order information</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading order details...</div>
        ) : order ? (
          <div className="order-detail-container">
            <div className="order-detail-header">
              <div className="order-info">
                <div className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <h2>Order #{order.id}</h2>
                <p className="order-date">Placed on {formatDate(order.orderDate)}</p>
              </div>

              <div className="order-actions">
                <Link to="/seller/orders" className="btn btn-outline">
                  Back to Orders
                </Link>

                {order.status === "pending" && (
                  <>
                    <button className="btn btn-primary" onClick={handleAcceptOrder} disabled={updating}>
                      {updating ? "Accepting..." : "Accept Order"}
                    </button>
                    <button className="btn btn-danger" onClick={handleRejectOrder} disabled={updating}>
                      {updating ? "Rejecting..." : "Reject Order"}
                    </button>
                  </>
                )}

                {order.status === "accepted" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateOrderStatus("packaging")}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Start Packaging"}
                  </button>
                )}

                {order.status === "packaging" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateOrderStatus("delivering")}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Out for Delivery"}
                  </button>
                )}

                {order.status === "delivering" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateOrderStatus("delivered")}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Mark as Delivered"}
                  </button>
                )}
              </div>
            </div>

            <div className="order-detail-content">
              <div className="order-detail-section">
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{order.customer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{order.customer.email}</span>
                </div>
              </div>

              <div className="order-detail-section">
                <h3>Delivery Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{order.deliveryAddress}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Slot:</span>
                  <span className="detail-value">{getDeliverySlotText(order.deliverySlot)}</span>
                </div>
                {order.estimatedDeliveryTime && (
                  <div className="detail-row">
                    <span className="detail-label">Estimated Delivery:</span>
                    <span className="detail-value">{formatDate(order.estimatedDeliveryTime)}</span>
                  </div>
                )}
              </div>

              <div className="order-detail-section">
                <h3>Order Items</h3>
                <div className="order-items-table">
                  <div className="items-header">
                    <div className="item-header-cell image-cell">Image</div>
                    <div className="item-header-cell name-cell">Product</div>
                    <div className="item-header-cell price-cell">Price</div>
                    <div className="item-header-cell qty-cell">Quantity</div>
                    <div className="item-header-cell total-cell">Total</div>
                  </div>

                  {order.items.map((item) => (
                    <div key={item.id} className="item-row">
                      <div className="item-cell image-cell">
                        <ImageWithFallback
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productName}
                          height={60}
                          width={60}
                          fallbackSrc="/placeholder.svg?height=60&width=60"
                        />
                      </div>
                      <div className="item-cell name-cell">{item.productName}</div>
                      <div className="item-cell price-cell">${item.productPrice.toFixed(2)}</div>
                      <div className="item-cell qty-cell">{item.quantity}</div>
                      <div className="item-cell total-cell">${item.subtotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-section">
                <h3>Payment Summary</h3>
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>

                  {order.gstAmount > 0 && (
                    <div className="summary-row">
                      <span>GST</span>
                      <span>${order.gstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
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

export default OrderDetail

