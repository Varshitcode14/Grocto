"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "../../context/ModalContext"
import "./Profile.css"

const UserProfile = () => {
  const { user, checkAuthStatus } = useAuth()
  const { showError, showSuccess } = useModal()
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
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/student/profile", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const data = await response.json()
      const profile = data.profile

      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        collegeId: profile.collegeId || "",
        department: profile.department || "",
      })

      // Set addresses if available
      if (profile.addresses) {
        console.log("Received addresses:", profile.addresses)
        setAddresses(profile.addresses || [])
      }

      // Initialize notifications from user profile if available
      if (profile.notifications) {
        setNotifications(profile.notifications)
      }

      // Check if profile is complete
      const isComplete = checkProfileComplete({
        phone: profile.phone || "",
        addresses: profile.addresses || [],
      })

      setIsProfileComplete(isComplete)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setMessage({ type: "error", text: "Failed to load profile data" })
    } finally {
      setLoading(false)
    }
  }

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

  const saveProfileData = async (profileData) => {
    try {
      setLoading(true)

      console.log("Saving profile data:", profileData)

      const response = await fetch("https://grocto-backend.onrender.com/api/student/profile", {
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

      console.log("Profile saved successfully")
    } catch (error) {
      console.error("Error saving profile:", error)
      setMessage({ type: "error", text: error.message || "Failed to save profile" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!formData.phone) {
        showError("Missing Information", "Phone number is required")
        return
      }

      setMessage({ type: "", text: "" }) // Clear any existing messages

      // Prepare the data to send to the backend
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        addresses: addresses,
        notifications: notifications,
      }

      await saveProfileData(profileData)

      // Show success message
      showSuccess("Profile Updated", "Your profile has been updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      showError("Update Failed", error.message || "Failed to update profile. Please try again.")
    }
  }

  const handleAddAddress = () => {
    // Validate address
    if (!newAddress.name || !newAddress.address) {
      showError("Missing Information", "Address name and details are required")
      return
    }

    // Create new address with ID
    const addressToAdd = {
      ...newAddress,
      id: Date.now(), // Use timestamp as temporary ID
    }

    let updatedAddresses = [...addresses]

    // If this is the first address or marked as default, make it default
    if (addresses.length === 0 || newAddress.isDefault) {
      // Set all other addresses to non-default
      updatedAddresses = addresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }))
      updatedAddresses.push(addressToAdd)
    } else {
      updatedAddresses.push(addressToAdd)
    }

    setAddresses(updatedAddresses)

    // Save the updated addresses to the server immediately
    const profileData = {
      ...formData,
      addresses: updatedAddresses,
    }

    saveProfileData(profileData)

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
      addresses: updatedAddresses,
    })

    // Show success message
    showSuccess("Address Added", "New address has been added successfully!")
  }

  const handleSetDefaultAddress = (id) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }))

    setAddresses(updatedAddresses)

    // Save the updated addresses to the server immediately
    const profileData = {
      ...formData,
      addresses: updatedAddresses,
    }

    saveProfileData(profileData)

    // Show success message
    showSuccess("Address Updated", "Default address has been updated!")
  }

  const handleDeleteAddress = (id) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id)

    // If we deleted the default address and there are other addresses, make the first one default
    if (addresses.find((addr) => addr.id === id)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true
    }

    setAddresses(updatedAddresses)

    // Save the updated addresses to the server immediately
    const profileData = {
      ...formData,
      addresses: updatedAddresses,
    }

    saveProfileData(profileData)

    // Check if profile is complete
    checkProfileComplete({
      phone: formData.phone,
      addresses: updatedAddresses,
    })

    // Show success message
    showSuccess("Address Deleted", "Address has been deleted successfully!")
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Location Error", "Geolocation is not supported by your browser")
      return
    }

    setIsAddingAddress(true)
    setNewAddress({
      ...newAddress,
      name: "Current Location",
    })

    setMessage({ type: "success", text: "Detecting your location..." })

    // Request high accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Show loading state
          setMessage({ type: "success", text: "Fetching your precise address..." })

          // Use OpenStreetMap's Nominatim service with more detailed parameters
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&namedetails=1`,
            {
              headers: {
                "Accept-Language": "en-US,en;q=0.9",
              },
            },
          )

          if (!response.ok) {
            throw new Error("Failed to fetch address")
          }

          const data = await response.json()

          // Format the address from the response with more detail
          let formattedAddress = ""

          if (data.address) {
            const addr = data.address
            const addressParts = []

            // Build detailed address string from components
            if (addr.house_number) addressParts.push(addr.house_number)
            if (addr.building) addressParts.push(addr.building)
            if (addr.road) addressParts.push(addr.road)
            if (addr.neighbourhood) addressParts.push(addr.neighbourhood)
            if (addr.suburb) addressParts.push(addr.suburb)
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village)
            if (addr.county) addressParts.push(addr.county)
            if (addr.state_district) addressParts.push(addr.state_district)
            if (addr.state) addressParts.push(addr.state)
            if (addr.postcode) addressParts.push(addr.postcode)

            formattedAddress = addressParts.join(", ")
          }

          // If we couldn't build a detailed address, use the display name
          if (!formattedAddress) {
            formattedAddress = data.display_name
          }

          // Add coordinates for extra precision
          formattedAddress += ` (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`

          // Update the new address form
          setNewAddress({
            ...newAddress,
            name: "Current Location",
            address: formattedAddress,
          })

          // Clear the message
          setMessage({ type: "", text: "" })

          showSuccess("Address Found", "Your precise location has been detected")
        } catch (error) {
          console.error("Error getting address from coordinates:", error)
          setMessage({ type: "", text: "" })
          showError("Location Error", "Failed to get your address. Please enter it manually.")
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setMessage({ type: "", text: "" })
        let errorMessage = "Failed to get your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied the request for geolocation"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out"
            break
        }

        showError("Location Error", errorMessage)
      },
      options, // Use the high accuracy options
    )
  }

  if (loading && !user) {
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
              <button onClick={handleSaveProfile} className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Profile Changes"}
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
                <button type="button" className="btn btn-outline location-btn" onClick={handleGetCurrentLocation}>
                  <i className="fas fa-map-marker-alt"></i> Use My Current Location
                </button>
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

