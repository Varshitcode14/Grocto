"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useModal } from "../context/ModalContext"
import "./Auth.css"

const SignUp = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showError, showSuccess } = useModal()
  const [userType, setUserType] = useState("student")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    collegeId: "",
  })

  const [sellerData, setSellerData] = useState({
    storeName: "",
    storeAddress: "",
    phoneNumber: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSellerChange = (e) => {
    const { name, value } = e.target
    setSellerData({
      ...sellerData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      showError("Password Error", "Passwords do not match")
      return
    }

    if (userType === "student" && !formData.collegeId) {
      showError("Missing Information", "College ID is required")
      return
    }

    if (userType === "seller" && (!sellerData.storeName || !sellerData.storeAddress || !sellerData.phoneNumber)) {
      showError("Missing Information", "All seller fields are required")
      return
    }

    try {
      setLoading(true)

      // Prepare data for registration
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userType,
      }

      if (userType === "student") {
        userData.collegeId = formData.collegeId
      } else {
        userData.storeName = sellerData.storeName
        userData.storeAddress = sellerData.storeAddress
        userData.phoneNumber = sellerData.phoneNumber
      }

      await register(userData)
      showSuccess("Registration Successful", "Your account has been created successfully. You can now sign in.")
      navigate("/signin")
    } catch (error) {
      console.error("Registration error:", error)
      if (error.message && error.message.includes("already registered")) {
        showError("Registration Failed", "This email is already registered. Please use a different email or sign in.")
      } else {
        showError("Registration Failed", error.message || "Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-container">
          <div className="auth-form-container">
            <h2 className="auth-title">Create Your Grocto Account</h2>

            <div className="user-type-toggle">
              <button
                className={`toggle-btn ${userType === "student" ? "active" : ""}`}
                onClick={() => setUserType("student")}
                type="button"
              >
                Student
              </button>
              <button
                className={`toggle-btn ${userType === "seller" ? "active" : ""}`}
                onClick={() => setUserType("seller")}
                type="button"
              >
                Grocery Seller
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
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

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={userType === "student" ? "your.name@college.edu" : "your.store@example.com"}
                  required
                />
              </div>

              {userType === "student" && (
                <div className="form-group">
                  <label htmlFor="collegeId">College ID</label>
                  <input
                    type="text"
                    id="collegeId"
                    name="collegeId"
                    value={formData.collegeId}
                    onChange={handleChange}
                    placeholder="Enter your college ID"
                    required
                  />
                </div>
              )}

              {userType === "seller" && (
                <>
                  <div className="form-group">
                    <label htmlFor="storeName">Store Name</label>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      value={sellerData.storeName}
                      onChange={handleSellerChange}
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
                      value={sellerData.storeAddress}
                      onChange={handleSellerChange}
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
                      value={sellerData.phoneNumber}
                      onChange={handleSellerChange}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/signin" className="auth-link">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SignUp

