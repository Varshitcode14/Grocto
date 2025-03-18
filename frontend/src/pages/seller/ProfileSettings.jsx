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
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [newDeliveryPerson, setNewDeliveryPerson] = useState({ name: "", phone: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/seller/profile", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const data = await response.json()
      const profile = data.profile

      setFormData({
        name: profile.name || "",
        storeName: profile.storeName || "",
        storeAddress: profile.storeAddress || "",
        phoneNumber: profile.phoneNumber || "",
        workingDays: profile.workingDays || "",
        openingTime: profile.openingTime || "",
        closingTime: profile.closingTime || "",
      })

      // Set delivery persons if available
      if (profile.deliveryPersons) {
        console.log("Received delivery persons:", profile.deliveryPersons)
        setDeliveryPersons(Array.isArray(profile.deliveryPersons) ? profile.deliveryPersons : [])
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile data")
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

  const handleDeliveryPersonChange = (e) => {
    const { name, value } = e.target
    setNewDeliveryPerson({
      ...newDeliveryPerson,
      [name]: value,
    })
  }

  const addDeliveryPerson = () => {
    if (!newDeliveryPerson.name || !newDeliveryPerson.phone) {
      setError("Both name and phone are required for delivery person")
      return
    }

    const newPerson = {
      ...newDeliveryPerson,
      id: Date.now(), // Use timestamp as a unique ID
    }

    const updatedDeliveryPersons = [...deliveryPersons, newPerson]
    setDeliveryPersons(updatedDeliveryPersons)
    setNewDeliveryPerson({ name: "", phone: "" })
    setError("")
  }

  const removeDeliveryPerson = (id) => {
    const updatedDeliveryPersons = deliveryPersons.filter((person) => person.id !== id)
    setDeliveryPersons(updatedDeliveryPersons)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      setLoading(true)

      // Ensure each delivery person has an id
      const deliveryPersonsWithIds = deliveryPersons.map((person) => {
        if (!person.id) {
          return { ...person, id: Date.now() + Math.random() }
        }
        return person
      })

      const updatedData = {
        ...formData,
        deliveryPersons: deliveryPersonsWithIds,
      }

      console.log("Sending profile data:", updatedData)

      const response = await fetch("https://grocto-backend.onrender.com/api/seller/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess("Profile updated successfully")
      setDeliveryPersons(deliveryPersonsWithIds)

      // Refresh user data
      await checkAuthStatus()

      // Fetch updated profile data to ensure we have the latest
      await fetchProfileData()
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

            <div className="form-section">
              <h2>Delivery Persons</h2>
              <p className="section-description">Add delivery personnel who will deliver orders to customers</p>

              <div className="delivery-persons-list">
                {deliveryPersons.length > 0 ? (
                  deliveryPersons.map((person) => (
                    <div key={person.id} className="delivery-person-item">
                      <div className="delivery-person-info">
                        <span className="person-name">{person.name}</span>
                        <span className="person-phone">{person.phone}</span>
                      </div>
                      <button type="button" className="btn-remove" onClick={() => removeDeliveryPerson(person.id)}>
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-delivery-persons">No delivery persons added yet</div>
                )}
              </div>

              <div className="add-delivery-person">
                <h3>Add New Delivery Person</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="deliveryPersonName">Name</label>
                    <input
                      type="text"
                      id="deliveryPersonName"
                      name="name"
                      value={newDeliveryPerson.name}
                      onChange={handleDeliveryPersonChange}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="deliveryPersonPhone">Phone</label>
                    <input
                      type="tel"
                      id="deliveryPersonPhone"
                      name="phone"
                      value={newDeliveryPerson.phone}
                      onChange={handleDeliveryPersonChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <button type="button" className="btn btn-outline add-person-btn" onClick={addDeliveryPerson}>
                  Add Delivery Person
                </button>
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

