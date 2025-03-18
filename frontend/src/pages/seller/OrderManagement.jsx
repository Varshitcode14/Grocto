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
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState("")
  const [showDeliveryPersonModal, setShowDeliveryPersonModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState(null)

  // Add useEffect to fetch delivery persons
  useEffect(() => {
    fetchOrders()
    fetchDeliveryPersons()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://grocto-backend.onrender.com/api/orders", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Fetched orders:", data.orders)
      setOrders(data.orders || [])
    } catch (e) {
      console.error("Error fetching orders:", e)
      setError(e.message || "Could not fetch orders")
    } finally {
      setLoading(false)
    }
  }

  // Add function to fetch delivery persons
  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch("https://grocto-backend.onrender.com/api/seller/profile", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched profile data:", data)
        if (data.profile && data.profile.deliveryPersons) {
          try {
            // If it's already an array, use it directly
            const parsedDeliveryPersons = Array.isArray(data.profile.deliveryPersons)
              ? data.profile.deliveryPersons
              : JSON.parse(data.profile.deliveryPersons)

            setDeliveryPersons(Array.isArray(parsedDeliveryPersons) ? parsedDeliveryPersons : [])
            console.log("Delivery persons set:", parsedDeliveryPersons)
          } catch (e) {
            console.error("Error parsing delivery persons:", e)
            setDeliveryPersons([])
          }
        } else {
          console.log("No delivery persons found in profile data")
          setDeliveryPersons([])
        }
      } else {
        console.error("Failed to fetch profile data:", response.status)
      }
    } catch (error) {
      console.error("Error fetching delivery persons:", error)
    }
  }

  // Add function to handle delivery person selection
  const handleDeliveryPersonChange = (e) => {
    setSelectedDeliveryPerson(e.target.value)
  }

  // Add function to open delivery person modal
  const openDeliveryPersonModal = (orderId) => {
    setCurrentOrderId(orderId)
    setSelectedDeliveryPerson("")
    setShowDeliveryPersonModal(true)
  }

  // Add function to close delivery person modal
  const closeDeliveryPersonModal = () => {
    setShowDeliveryPersonModal(false)
    setCurrentOrderId(null)
    setSelectedDeliveryPerson("")
  }

  // Add function to assign delivery person and update status
  const assignDeliveryPersonAndUpdateStatus = async () => {
    if (!selectedDeliveryPerson) {
      setError("Please select a delivery person")
      return
    }

    try {
      setUpdatingOrder(currentOrderId)

      const selectedPerson = deliveryPersons.find((p) => p.id.toString() === selectedDeliveryPerson)
      if (!selectedPerson) {
        throw new Error("Selected delivery person not found")
      }

      const deliveryPersonContact = `${selectedPerson.name} (${selectedPerson.phone})`

      const response = await fetch(`https://grocto-backend.onrender.com/api/orders/${currentOrderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "delivering",
          deliveryPersonContact: deliveryPersonContact,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update order status")
      }

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === currentOrderId
            ? { ...order, status: "delivering", deliveryPersonContact: deliveryPersonContact }
            : order,
        ),
      )

      // Close modal and refresh orders
      closeDeliveryPersonModal()
      fetchOrders()
    } catch (error) {
      setError(error.message || "Error updating order status")
      console.error("Error updating order status:", error)
    } finally {
      setUpdatingOrder(null)
    }
  }

  // Update the updateOrderStatus function to handle delivery person selection
  const updateOrderStatus = async (orderId, status) => {
    // If status is "delivering", open delivery person selection modal
    if (status === "delivering") {
      openDeliveryPersonModal(orderId)
      return
    }

    try {
      setUpdatingOrder(orderId)

      const payload = { status }

      const response = await fetch(`https://grocto-backend.onrender.com/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update order status")
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

    updateOrderStatus(orderId, "accepted")
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

  // Add the delivery person modal to the JSX
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
                      disabled={updatingOrder === order.id || deliveryPersons.length === 0}
                      title={deliveryPersons.length === 0 ? "Add delivery persons in your profile first" : ""}
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

        {/* Delivery Person Selection Modal */}
        {showDeliveryPersonModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>Select Delivery Person</h2>
                <button className="modal-close" onClick={closeDeliveryPersonModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {deliveryPersons.length > 0 ? (
                  <div className="form-group">
                    <label htmlFor="deliveryPerson">Delivery Person</label>
                    <select
                      id="deliveryPerson"
                      value={selectedDeliveryPerson}
                      onChange={handleDeliveryPersonChange}
                      className="form-control"
                    >
                      <option value="">Select a delivery person</option>
                      {deliveryPersons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} ({person.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="no-delivery-persons-warning">
                    <p>You haven't added any delivery persons yet.</p>
                    <p>Please add delivery persons in your profile settings first.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeDeliveryPersonModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={assignDeliveryPersonAndUpdateStatus}
                  disabled={!selectedDeliveryPerson || updatingOrder === currentOrderId}
                >
                  {updatingOrder === currentOrderId ? "Updating..." : "Assign & Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderManagement

