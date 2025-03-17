"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { formatToIST } from "../../utils/dateUtils"
import "./OrdersList.css"

const OrdersList = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/orders", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      setError(error.message || "Error fetching orders")
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
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
    <div className="orders-list-page">
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length > 0 ? (
          <div className="orders-container">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">{formatToIST(order.orderDate)}</p>
                  </div>
                  <div className={`order-status ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-store">
                    <span className="detail-label">Store:</span>
                    <span className="detail-value">{order.storeName}</span>
                  </div>

                  <div className="order-delivery">
                    <span className="detail-label">Delivery Slot:</span>
                    <span className="detail-value">{order.deliverySlot}</span>
                  </div>

                  {order.estimatedDeliveryTime && (
                    <div className="order-delivery-time">
                      <span className="detail-label">Estimated Delivery:</span>
                      <span className="detail-value">{formatToIST(order.estimatedDeliveryTime)}</span>
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <span className="total-label">Total:</span>
                    <span className="total-value">₹{order.totalAmount.toFixed(2)}</span>
                  </div>

                  <Link to={`/student/orders/${order.id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders">
            <p>You haven't placed any orders yet.</p>
            <Link to="/student/stores" className="btn btn-primary">
              Browse Stores
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersList

