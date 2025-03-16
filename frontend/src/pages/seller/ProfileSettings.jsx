"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import "./ProfileSettings.css"

const ProfileSettings = () => {
  const { user, checkAuthStatus } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    storeName: "",
    storeAddress: "",
    phoneNumber: "",
    workingDays: "",
    openingTime: "",
    closingTime: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        storeName: user.profile?.storeName || "",
        storeAddress: user.profile?.storeAddress || "",
        phoneNumber: user.profile?.phoneNumber || "",
        workingDays: user.profile?.workingDays || "",
        openingTime: user.profile?.openingTime || "",
        closingTime: user.profile?.closingTime || "",
      })
    }
  }, [user])

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
    setSuccess("")

    try {
      setLoading(true)

      const response = await fetch("http://localhost:5000/api/seller/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess("Profile updated successfully")

      // Refresh user data
      await checkAuthStatus()
    } catch (error) {
      setError(error.message || "Error updating profile")
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-settings-page">
      <div className="container">
        <div className="page-header">
          <h1>Profile Settings</h1>
          <p>Update your store information and settings</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-form-container">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Personal Information</h2>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Store Information</h2>
              <div className="form-group">
                <label htmlFor="storeName">Store Name</label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Enter your store name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="storeAddress">Store Address</label>
                <input
                  type="text"
                  id="storeAddress"
                  name="storeAddress"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  placeholder="Enter your store address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Operating Hours</h2>
              <div className="form-group">
                <label htmlFor="workingDays">Working Days</label>
                <input
                  type="text"
                  id="workingDays"
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleChange}
                  placeholder="e.g. Monday-Friday"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="openingTime">Opening Time</label>
                  <input
                    type="time"
                    id="openingTime"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="closingTime">Closing Time</label>
                  <input
                    type="time"
                    id="closingTime"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings

