"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import "./Profile.css"

const UserProfile = () => {
  const { user, checkAuthStatus } = useAuth()
  // State for Profile
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    collegeId: "",
    department: "",
  })
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })

  // State for Addresses
  const [addresses, setAddresses] = useState([])
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    isDefault: false,
  })
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  // State for Notifications
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newArrivals: true,
    emailNotifications: true,
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.profile?.phone || "",
        collegeId: user.profile?.collegeId || "",
        department: user.profile?.department || "",
      })

      // Fetch addresses from API (mock data for now)
      // In a real app, you would fetch this from your backend
      const mockAddresses = user.profile?.addresses || []
      setAddresses(mockAddresses)

      // Initialize notifications from user profile if available
      if (user.profile?.notifications) {
        setNotifications(user.profile.notifications)
      }

      // Check if profile is complete
      const isComplete = checkProfileComplete({
        phone: user.profile?.phone || "",
        addresses: mockAddresses,
      })

      setIsProfileComplete(isComplete)
      setLoading(false)
    }
  }, [user])

  // Check if profile is complete (has phone and at least one address)
  const checkProfileComplete = (data) => {
    const { phone, addresses } = data
    const hasPhone = phone && phone.trim() !== ""
    const hasAddress = addresses && addresses.length > 0
    const isComplete = hasPhone && hasAddress

    console.log("Profile completeness check:", { hasPhone, hasAddress, isComplete })

    setIsProfileComplete(isComplete)
    return isComplete
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle new address input changes
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewAddress({
      ...newAddress,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // Toggle Notifications
  const handleToggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
    console.log("Notifications Updated:", {
      ...notifications,
      [key]: !notifications[key],
    })
  }

  // Save Profile Changes
  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!formData.phone) {
        setMessage({ type: "error", text: "Phone number is required" })
        return
      }

      setMessage({ type: "", text: "" }) // Clear any existing messages

      // Prepare the data to send to the backend
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        addresses: addresses,
      }

      // Send the data to the backend
      const response = await fetch("http://localhost:5000/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      // Refresh auth status to get updated user data
      await checkAuthStatus()

      // Check if profile is complete with the updated data
      const isComplete = checkProfileComplete({
        phone: formData.phone,
        addresses: addresses,
      })

      setIsProfileComplete(isComplete)

      // Show success message
      setMessage({ type: "success", text: "Profile updated successfully!" })

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" })
      }, 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: error.message || "Failed to update profile. Please try again." })
    }
  }

  // Add new address
  const handleAddAddress = () => {
    // Validate address
    if (!newAddress.name || !newAddress.address) {
      setMessage({ type: "error", text: "Address name and details are required" })
      return
    }

    // Create new address with ID
    const addressToAdd = {
      ...newAddress,
      id: Date.now(), // Use timestamp as temporary ID
    }

    // If this is the first address or marked as default, make it default
    if (addresses.length === 0 || newAddress.isDefault) {
      // Set all other addresses to non-default
      const updatedAddresses = addresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }))
      setAddresses([...updatedAddresses, addressToAdd])
    } else {
      setAddresses([...addresses, addressToAdd])
    }

    // Reset new address form
    setNewAddress({
      name: "",
      address: "",
      isDefault: false,
    })
    setIsAddingAddress(false)

    // Check if profile is complete
    checkProfileComplete({
      phone: formData.phone,
      addresses: [...addresses, addressToAdd],
    })

    // Show success message
    setMessage({ type: "success", text: "Address added successfully!" })

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 3000)
  }

  // Set address as default
  const handleSetDefaultAddress = (id) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }))
    setAddresses(updatedAddresses)

    // Show success message
    setMessage({ type: "success", text: "Default address updated!" })

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 3000)
  }

  // Delete address
  const handleDeleteAddress = (id) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id)

    // If we deleted the default address and there are other addresses, make the first one default
    if (addresses.find((addr) => addr.id === id)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true
    }

    setAddresses(updatedAddresses)

    // Check if profile is complete
    checkProfileComplete({
      phone: formData.phone,
      addresses: updatedAddresses,
    })

    // Show success message
    setMessage({ type: "success", text: "Address deleted!" })

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 3000)
  }

  if (loading) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account information and delivery addresses</p>
        </div>

        {/* Profile Completeness Alert */}
        {!isProfileComplete && (
          <div className="profile-alert">
            <p>
              <strong>Your profile is incomplete!</strong> Please add a phone number and at least one delivery address
              to place orders.
            </p>
          </div>
        )}

        {isProfileComplete && (
          <div className="profile-complete-alert">
            <p>
              <strong>Your profile is complete!</strong> You can now place orders.
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {/* Profile Section */}
        <div className="profile-section">
          <h2 className="section-title">Account Information</h2>
          <div className="form-container">
            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>

            {/* College ID */}
            <div className="form-group">
              <label>College ID</label>
              <input type="text" name="collegeId" value={formData.collegeId} onChange={handleChange} />
            </div>

            {/* Phone Number - Required */}
            <div className="form-group required">
              <label>
                Phone Number <span className="required-mark">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
              <small>Required for delivery</small>
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled />
              <small>Email cannot be changed</small>
            </div>

            {/* Department */}
            <div className="form-group">
              <label>Department</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} />
            </div>

            {/* Save Button */}
            <div className="form-actions">
              <button onClick={handleSaveProfile} className="btn btn-primary">
                Save Profile Changes
              </button>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="profile-section">
          <h2 className="section-title">
            Delivery Addresses <span className="required-mark">*</span>
          </h2>

          {/* Existing Addresses */}
          <div className="addresses-container">
            {addresses.length > 0 ? (
              addresses.map((addr) => (
                <div key={addr.id} className={`address-item ${addr.isDefault ? "default-address" : ""}`}>
                  <div className="address-content">
                    <h3>{addr.name}</h3>
                    <p>{addr.address}</p>
                    {addr.isDefault && <span className="default-badge">Default</span>}
                  </div>
                  <div className="address-actions">
                    {!addr.isDefault && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleSetDefaultAddress(addr.id)}>
                        Set as Default
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAddress(addr.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-addresses">No addresses saved yet. Please add a delivery address.</p>
            )}

            {/* Add New Address Form */}
            {isAddingAddress ? (
              <div className="new-address-form">
                <h3>Add New Address</h3>
                <div className="form-group">
                  <label>Address Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newAddress.name}
                    onChange={handleAddressChange}
                    placeholder="e.g. Home, Dorm, etc."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Details</label>
                  <textarea
                    name="address"
                    value={newAddress.address}
                    onChange={handleAddressChange}
                    placeholder="Enter your full address"
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleAddressChange}
                    />
                    Set as default address
                  </label>
                </div>
                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setIsAddingAddress(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddAddress}>
                    Save Address
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-outline add-address-btn" onClick={() => setIsAddingAddress(true)}>
                Add New Address
              </button>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="profile-section">
          <h2 className="section-title">Notification Preferences</h2>
          <div className="notifications-container">
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  checked={notifications.orderUpdates}
                  onChange={() => handleToggleNotification("orderUpdates")}
                />
                <span>Order Updates</span>
              </label>
            </div>
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  checked={notifications.promotions}
                  onChange={() => handleToggleNotification("promotions")}
                />
                <span>Promotions</span>
              </label>
            </div>
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  checked={notifications.newArrivals}
                  onChange={() => handleToggleNotification("newArrivals")}
                />
                <span>New Arrivals</span>
              </label>
            </div>
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => handleToggleNotification("emailNotifications")}
                />
                <span>Email Notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

