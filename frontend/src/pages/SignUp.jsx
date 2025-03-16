"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "./Auth.css"

const SignUp = () => {
  const [userType, setUserType] = useState("student")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [sellerData, setSellerData] = useState({
    storeName: "",
    storeAddress: "",
    phoneNumber: "",
  })

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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (userType === "student") {
      console.log("Sign Up Data (Student):", formData)
    } else {
      console.log("Sign Up Data (Seller):", { ...formData, ...sellerData })
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
              >
                Student
              </button>
              <button
                className={`toggle-btn ${userType === "seller" ? "active" : ""}`}
                onClick={() => setUserType("seller")}
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

              <button type="submit" className="btn btn-primary auth-btn">
                Sign Up
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

