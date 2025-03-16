"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./OrderManagement.css"

const OrderManagement = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [updatingOrder, setUpdatingOrder] = useState(null)

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

  const updateOrderStatus = async (orderId, status, estimatedDeliveryTime = null) => {
    try {
      setUpdatingOrder(orderId)

      const payload = { status }
      if (estimatedDeliveryTime) {
        payload.estimatedDeliveryTime = estimatedDeliveryTime
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

      // Update local state
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))

      // Refresh orders to get updated data
      fetchOrders()
    } catch (error) {
      setError(error.message || "Error updating order status")
      console.error("Error updating order status:", error)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleAcceptOrder = (orderId) => {
    // Calculate estimated delivery time (2 hours from now)
    const estimatedTime = new Date()
    estimatedTime.setHours(estimatedTime.getHours() + 2)

    updateOrderStatus(orderId, "accepted", estimatedTime.toISOString())
  }

  const handleRejectOrder = (orderId) => {
    if (window.confirm("Are you sure you want to reject this order?")) {
      updateOrderStatus(orderId, "rejected")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  return (
    <div className="order-management-page">
      <div className="container">
        <div className="page-header">
          <h1>Order Management</h1>
          <p>Manage and track customer orders</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="order-tabs">
          <button className={`tab-button ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            All Orders
          </button>
          <button
            className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>
          <button
            className={`tab-button ${activeTab === "accepted" ? "active" : ""}`}
            onClick={() => setActiveTab("accepted")}
          >
            Accepted
          </button>
          <button
            className={`tab-button ${activeTab === "packaging" ? "active" : ""}`}
            onClick={() => setActiveTab("packaging")}
          >
            Packaging
          </button>
          <button
            className={`tab-button ${activeTab === "delivering" ? "active" : ""}`}
            onClick={() => setActiveTab("delivering")}
          >
            Delivering
          </button>
          <button
            className={`tab-button ${activeTab === "delivered" ? "active" : ""}`}
            onClick={() => setActiveTab("delivered")}
          >
            Delivered
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="orders-table">
            <div className="table-header">
              <div className="header-cell">Order ID</div>
              <div className="header-cell">Customer</div>
              <div className="header-cell">Date</div>
              <div className="header-cell">Total</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
            </div>

            {filteredOrders.map((order) => (
              <div key={order.id} className="table-row">
                <div className="cell">#{order.id}</div>
                <div className="cell">{order.customerName}</div>
                <div className="cell">{formatDate(order.orderDate)}</div>
                <div className="cell price-cell">₹{order.totalAmount.toFixed(2)}</div>
                <div className="cell">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="cell actions-cell">
                  <Link to={`/seller/orders/${order.id}`} className="btn btn-outline btn-sm">
                    View
                  </Link>

                  {order.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={updatingOrder === order.id}
                      >
                        {updatingOrder === order.id ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectOrder(order.id)}
                        disabled={updatingOrder === order.id}
                      >
                        {updatingOrder === order.id ? "Rejecting..." : "Reject"}
                      </button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => updateOrderStatus(order.id, "packaging")}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? "Updating..." : "Start Packaging"}
                    </button>
                  )}

                  {order.status === "packaging" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => updateOrderStatus(order.id, "delivering")}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? "Updating..." : "Out for Delivery"}
                    </button>
                  )}

                  {order.status === "delivering" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? "Updating..." : "Mark Delivered"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders">{activeTab === "all" ? "No orders found." : `No ${activeTab} orders found.`}</div>
        )}
      </div>
    </div>
  )
}

export default OrderManagement

