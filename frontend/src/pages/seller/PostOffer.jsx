"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ProductSelectionModal from "../../components/ProductSelectionModal"
import "./PostOffer.css"

const PostOffer = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "Percentage",
    amount: "",
    minPurchase: "",
    offerLimit: "",
    startingDate: "",
    closingDate: "",
    applicableProducts: "all", // Default to 'all'
  })

  const [selectedProducts, setSelectedProducts] = useState([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    // Hide notification after 3 seconds
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification.show])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
  }

  // Function to convert date to IST format
  const formatDateToIST = (dateString) => {
    if (!dateString) return ""

    // Create a date object with the input date
    const date = new Date(dateString)

    // Format the date to ISO string with IST timezone offset (+05:30)
    // This ensures the date is interpreted correctly on the server
    const istDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0]

    return istDate
  }

  const openProductSelectionModal = () => {
    setShowProductModal(true)
  }

  const handleProductSelection = (products) => {
    setSelectedProducts(products)
    if (products.length > 0) {
      setFormData({
        ...formData,
        applicableProducts: "specific",
      })
    } else {
      setFormData({
        ...formData,
        applicableProducts: "all",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Validate dates
      const startDate = new Date(formData.startingDate)
      const endDate = new Date(formData.closingDate)
      const today = new Date()

      if (startDate < today) {
        showNotification("Starting date cannot be in the past", "error")
        setLoading(false)
        return
      }

      if (endDate <= startDate) {
        showNotification("Closing date must be after starting date", "error")
        setLoading(false)
        return
      }

      // Convert dates to IST format
      const startingDateIST = formatDateToIST(formData.startingDate)
      const closingDateIST = formatDateToIST(formData.closingDate)

      // Create JSON data for API
      const offerData = {
        title: formData.title,
        description: formData.description,
        minPurchase: Number.parseFloat(formData.minPurchase),
        offerLimit: Number.parseInt(formData.offerLimit),
        startingDate: startingDateIST,
        closingDate: closingDateIST,
        amount: Number.parseFloat(formData.amount),
        discountType: formData.discountType === "Percentage" ? "percentage" : "fixed",
        applicableProducts: formData.applicableProducts === "all" ? "all" : selectedProducts,
      }

      console.log("Submitting offer data:", offerData)

      const response = await fetch("http://localhost:5000/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to post offer")
      }

      // Redirect to inventory page
      showNotification("Offer posted successfully", "success")
      setTimeout(() => {
        navigate("/seller/offers")
      }, 2000)
    } catch (error) {
      showNotification("Offer cannot be posted: " + error.message, "error")
      console.error("Error posting offer:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-offer-page">
      {notification.show && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="container">
        <div className="page-header">
          <h1>Post New Offer</h1>
          <p>All dates and times are in Indian Standard Time (IST)</p>
        </div>

        <div className="offer-form-container">
          <form className="offer-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Offer Title</label>
              <input
                type="text"
                id="name"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter Offer Title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter offer description"
                rows="4"
              ></textarea>
            </div>

            <div className="discount">
              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label htmlFor="discountType" style={{ margin: "0" }}>
                  Discount Type:
                </label>
                <select name="discountType" id="discountType" value={formData.discountType} onChange={handleChange}>
                  <option value="Percentage">Percentage</option>
                  <option value="Fixed Amount">Fixed Amount</option>
                </select>
              </div>
              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label htmlFor="amount" style={{ margin: "0" }}>
                  Discount Amount:
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter Discount amount"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minPurchase">Minimum Purchase (₹)</label>
                <input
                  type="number"
                  id="minPurchase"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  placeholder="0"
                  step="1"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="applicableProducts">Applicable Products</label>
                <input
                  type="text"
                  id="applicableProducts"
                  name="applicableProducts"
                  value={selectedProducts.length > 0 ? `${selectedProducts.length} products selected` : "All products"}
                  onClick={openProductSelectionModal}
                  readOnly
                  placeholder="Click to select products"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="offerLimit">Offer Limit</label>
                <input
                  type="number"
                  id="offerLimit"
                  name="offerLimit"
                  value={formData.offerLimit}
                  onChange={handleChange}
                  placeholder="0"
                  step="1"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ display: "flex" }}>
              <div className="form-group">
                <label htmlFor="startingDate">Starting Date (IST)</label>
                <input
                  type="date"
                  id="startingDate"
                  name="startingDate"
                  value={formData.startingDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="closingDate">Closing Date (IST)</label>
                <input
                  type="date"
                  id="closingDate"
                  name="closingDate"
                  value={formData.closingDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="button1" onClick={() => navigate("/seller/offers")} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="button2" disabled={loading}>
                {loading ? "Posting Offer..." : "Post Offer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={handleProductSelection}
        selectedProducts={selectedProducts}
      />
    </div>
  )
}

export default PostOffer

