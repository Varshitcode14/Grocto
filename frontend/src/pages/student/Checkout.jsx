"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./Checkout.css"

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [store, setStore] = useState(null)
  const [deliverySlots, setDeliverySlots] = useState([])
  const [summary, setSummary] = useState({
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  // State for saved addresses
  const [savedAddresses, setSavedAddresses] = useState([])
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    deliveryAddressId: "",
    newDeliveryAddress: "",
    deliveryStartTime: "",
    deliveryEndTime: "",
    selectedSlotId: null,
  })

  useEffect(() => {
    fetchCart()
    fetchSavedAddresses()
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

      if (!data.items || data.items.length === 0) {
        navigate("/student/cart")
        return
      }

      setCartItems(data.items || [])
      setStore(data.store || null)
      setDeliverySlots(data.deliverySlots || [])
      setSummary({
        subtotal: data.summary.subtotal,
        deliveryFee: 0, // Will be set when slot is selected
        total: data.summary.subtotal, // Will be updated when slot is selected
      })
    } catch (error) {
      setError(error.message || "Error fetching cart")
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedAddresses = async () => {
    try {
      // In a real app, you would fetch this from your backend
      // For now, we'll use mock data based on the user's profile
      const mockAddresses = user?.profile?.addresses || []

      // If there are saved addresses, set the default one as selected
      if (mockAddresses.length > 0) {
        const defaultAddress = mockAddresses.find((addr) => addr.isDefault) || mockAddresses[0]
        setFormData((prev) => ({
          ...prev,
          deliveryAddressId: defaultAddress.id.toString(),
        }))
      }

      setSavedAddresses(mockAddresses)
    } catch (error) {
      console.error("Error fetching saved addresses:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // If selecting an address option
    if (name === "deliveryAddressId" && value === "new") {
      setIsAddingNewAddress(true)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
      return
    } else if (name === "deliveryAddressId") {
      setIsAddingNewAddress(false)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTimeChange = (e) => {
    const { name, value } = e.target

    // Update the time value
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // If both start and end times are set, find the matching slot
    if (
      (name === "deliveryStartTime" && formData.deliveryEndTime) ||
      (name === "deliveryEndTime" && formData.deliveryStartTime)
    ) {
      const startTime = name === "deliveryStartTime" ? value : formData.deliveryStartTime
      const endTime = name === "deliveryEndTime" ? value : formData.deliveryEndTime

      // Convert times to minutes for comparison
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      // Check if interval is at least 1 hour
      if (endMinutes - startMinutes < 60) {
        setError("Delivery time interval must be at least 1 hour")
        return
      }

      // Find the matching slot
      let matchingSlot = null
      for (const slot of deliverySlots) {
        const [slotStartHour, slotStartMinute] = slot.startTime.split(":").map(Number)
        const [slotEndHour, slotEndMinute] = slot.endTime.split(":").map(Number)

        const slotStartMinutes = slotStartHour * 60 + slotStartMinute
        const slotEndMinutes = slotEndHour * 60 + slotEndMinute

        if (slotStartMinutes <= startMinutes && endMinutes <= slotEndMinutes) {
          matchingSlot = slot
          break
        }
      }

      if (matchingSlot) {
        setError("")
        setFormData((prev) => ({
          ...prev,
          selectedSlotId: matchingSlot.id,
        }))

        // Update delivery fee and total
        setSummary((prev) => ({
          ...prev,
          deliveryFee: matchingSlot.deliveryFee,
          total: prev.subtotal + matchingSlot.deliveryFee,
        }))
      } else {
        setError("Selected time does not match any available delivery slots")
        setFormData((prev) => ({
          ...prev,
          selectedSlotId: null,
        }))

        // Reset delivery fee
        setSummary((prev) => ({
          ...prev,
          deliveryFee: 0,
          total: prev.subtotal,
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate address selection
    if (isAddingNewAddress && !formData.newDeliveryAddress.trim()) {
      setError("Please enter a delivery address")
      return
    }

    if (!isAddingNewAddress && !formData.deliveryAddressId) {
      setError("Please select a delivery address")
      return
    }

    if (!formData.deliveryStartTime || !formData.deliveryEndTime) {
      setError("Please select delivery time")
      return
    }

    if (!formData.selectedSlotId) {
      setError("Selected time does not match any available delivery slots")
      return
    }

    try {
      setProcessing(true)
      setError("")

      // Get the delivery address (either selected or new)
      const deliveryAddress = isAddingNewAddress
        ? formData.newDeliveryAddress
        : savedAddresses.find((addr) => addr.id.toString() === formData.deliveryAddressId)?.address

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryAddress,
          deliveryStartTime: formData.deliveryStartTime,
          deliveryEndTime: formData.deliveryEndTime,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to place order")
      }

      const data = await response.json()

      // Navigate to order confirmation page
      navigate(`/student/order-confirmation/${data.orderId}`)
    } catch (error) {
      setError(error.message || "Error placing order")
      console.error("Error placing order:", error)
    } finally {
      setProcessing(false)
    }
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

  // Check if user profile is complete
  const isProfileComplete = () => {
    return user?.profile?.phone && savedAddresses.length > 0
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="page-header">
          <h1>Checkout</h1>
          <p>Complete your order</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading checkout information...</div>
        ) : !isProfileComplete() ? (
          <div className="profile-incomplete">
            <h2>Your profile is incomplete</h2>
            <p>Please complete your profile before placing an order. You need to add:</p>
            <ul>
              {!user?.profile?.phone && <li>Phone number</li>}
              {savedAddresses.length === 0 && <li>At least one delivery address</li>}
            </ul>
            <button className="btn btn-primary" onClick={() => navigate("/student/profile")}>
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="checkout-container">
            <div className="checkout-form-container">
              <form className="checkout-form" onSubmit={handleSubmit}>
                <div className="form-section">
                  <h2>Delivery Information</h2>

                  {/* Address Selection */}
                  <div className="form-group">
                    <label htmlFor="deliveryAddressId">Delivery Address</label>
                    <select
                      id="deliveryAddressId"
                      name="deliveryAddressId"
                      value={formData.deliveryAddressId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select an address</option>
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id.toString()}>
                          {addr.name}: {addr.address} {addr.isDefault ? "(Default)" : ""}
                        </option>
                      ))}
                      <option value="new">+ Add a new address</option>
                    </select>
                  </div>

                  {/* New Address Input (shown only when "Add a new address" is selected) */}
                  {isAddingNewAddress && (
                    <div className="form-group">
                      <label htmlFor="newDeliveryAddress">New Delivery Address</label>
                      <textarea
                        id="newDeliveryAddress"
                        name="newDeliveryAddress"
                        value={formData.newDeliveryAddress}
                        onChange={handleChange}
                        placeholder="Enter your full delivery address"
                        required
                        rows={3}
                      ></textarea>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Available Delivery Slots</label>
                    <div className="delivery-slots">
                      {deliverySlots.map((slot) => (
                        <div key={slot.id} className="delivery-slot-info">
                          <span className="slot-time">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                          <span className="slot-fee">₹{slot.deliveryFee.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="deliveryStartTime">Delivery Start Time</label>
                      <input
                        type="time"
                        id="deliveryStartTime"
                        name="deliveryStartTime"
                        value={formData.deliveryStartTime}
                        onChange={handleTimeChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="deliveryEndTime">Delivery End Time</label>
                      <input
                        type="time"
                        id="deliveryEndTime"
                        name="deliveryEndTime"
                        value={formData.deliveryEndTime}
                        onChange={handleTimeChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="delivery-time-note">
                    <p>
                      Note: Delivery time interval must be at least 1 hour and must fall within one of the available
                      slots.
                    </p>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Order Summary</h2>

                  {store && (
                    <div className="store-info">
                      <h3>Ordering from: {store.name}</h3>
                      <p>{store.address}</p>
                    </div>
                  )}

                  <div className="order-items">
                    <h3>Items ({cartItems.length})</h3>
                    {cartItems.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="item-image">
                          <ImageWithFallback
                            src={item.product.image || "/placeholder.svg"}
                            alt={item.product.name}
                            height={60}
                            width={60}
                            fallbackSrc="/placeholder.svg?height=60&width=60"
                          />
                        </div>
                        <div className="item-details">
                          <h4>{item.product.name}</h4>
                          <div className="item-price-qty">
                            <span>
                              ₹{item.product.price.toFixed(2)} × {item.quantity}
                            </span>
                            <span>₹{item.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="price-summary">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>₹{summary.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="summary-row">
                      <span>Delivery Fee</span>
                      <span>₹{summary.deliveryFee.toFixed(2)}</span>
                    </div>

                    <div className="summary-total">
                      <span>Total</span>
                      <span>₹{summary.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate("/student/cart")}
                    disabled={processing}
                  >
                    Back to Cart
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={processing || !formData.selectedSlotId}>
                    {processing ? "Processing..." : "Place Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkout

