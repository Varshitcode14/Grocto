"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import "./DeliverySlots.css"

const DeliverySlots = () => {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    deliveryFee: "",
  })
  const [editingSlot, setEditingSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDeliverySlots()
  }, [])

  const fetchDeliverySlots = async () => {
    try {
      setLoading(true)
      const sellerId = user.profile.id
      const response = await fetch(`http://localhost:5000/api/delivery-slots?seller_id=${sellerId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch delivery slots")
      }

      const data = await response.json()
      setSlots(data.deliverySlots || [])
    } catch (error) {
      setError(error.message || "Error fetching delivery slots")
      console.error("Error fetching delivery slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      setSubmitting(true)

      const payload = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        deliveryFee: Number.parseFloat(formData.deliveryFee),
      }

      let response
      if (editingSlot) {
        // Update existing slot
        response = await fetch(`http://localhost:5000/api/delivery-slots/${editingSlot.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      } else {
        // Create new slot
        response = await fetch("http://localhost:5000/api/delivery-slots", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save delivery slot")
      }

      // Reset form and refresh slots
      setFormData({
        startTime: "",
        endTime: "",
        deliveryFee: "",
      })
      setEditingSlot(null)
      fetchDeliverySlots()
    } catch (error) {
      setError(error.message || "Error saving delivery slot")
      console.error("Error saving delivery slot:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (slot) => {
    setFormData({
      startTime: slot.startTime,
      endTime: slot.endTime,
      deliveryFee: slot.deliveryFee.toString(),
    })
    setEditingSlot(slot)
  }

  const handleDelete = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this delivery slot?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/delivery-slots/${slotId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete delivery slot")
      }

      // Refresh slots
      fetchDeliverySlots()
    } catch (error) {
      setError(error.message || "Error deleting delivery slot")
      console.error("Error deleting delivery slot:", error)
    }
  }

  const handleCancel = () => {
    setFormData({
      startTime: "",
      endTime: "",
      deliveryFee: "",
    })
    setEditingSlot(null)
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="delivery-slots-page">
      <div className="container">
        <div className="page-header">
          <h1>Delivery Slots Management</h1>
          <p>Configure your delivery time slots and pricing</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="delivery-slots-container">
          <div className="delivery-slots-form-container">
            <h2>{editingSlot ? "Edit Delivery Slot" : "Add New Delivery Slot"}</h2>
            <form className="delivery-slots-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deliveryFee">Delivery Fee (₹)</label>
                <input
                  type="number"
                  id="deliveryFee"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-actions">
                {editingSlot && (
                  <button type="button" className="btn btn-outline" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editingSlot ? "Update Slot" : "Add Slot"}
                </button>
              </div>
            </form>
          </div>

          <div className="delivery-slots-list-container">
            <h2>Your Delivery Slots</h2>
            {loading ? (
              <div className="loading">Loading delivery slots...</div>
            ) : slots.length > 0 ? (
              <div className="delivery-slots-list">
                {slots.map((slot) => (
                  <div key={slot.id} className="delivery-slot-card">
                    <div className="slot-details">
                      <div className="slot-time">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      <div className="slot-fee">₹{slot.deliveryFee.toFixed(2)}</div>
                    </div>
                    <div className="slot-actions">
                      <button className="btn-edit" onClick={() => handleEdit(slot)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(slot.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-slots">
                <p>You haven't set up any delivery slots yet.</p>
                <p>Add your first slot to start accepting orders.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliverySlots

