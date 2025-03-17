"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AddOffer.css" // Reuse the same CSS
import ProductSelectionModal from "../../components/ProductSelectionModal"

const EditOffer = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    amount: "",
    minPurchase: "",
    offerLimit: "",
    startingDate: "",
    closingDate: "",
    productScope: "all", // 'all' or 'specific'
  })

  const [selectedProducts, setSelectedProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingOffer, setFetchingOffer] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchOfferDetails()
  }, [id])

  const fetchOfferDetails = async () => {
    try {
      setFetchingOffer(true)
      const response = await axios.get(`/api/offers/${id}`)
      const offer = response.data.offer

      // Format dates for input fields
      const startDate = new Date(offer.startingDate)
      const endDate = new Date(offer.closingDate)

      const formattedStartDate = startDate.toISOString().split("T")[0]
      const formattedEndDate = endDate.toISOString().split("T")[0]

      // Determine if offer applies to all products or specific ones
      const productScope = offer.applicableProducts === "all" ? "all" : "specific"

      // Set form data
      setFormData({
        title: offer.title,
        description: offer.description || "",
        discountType: offer.discountType,
        amount: offer.amount.toString(),
        minPurchase: offer.minPurchase.toString(),
        offerLimit: offer.offerLimit ? offer.offerLimit.toString() : "",
        startingDate: formattedStartDate,
        closingDate: formattedEndDate,
        productScope: productScope,
      })

      // Set selected products if applicable
      if (productScope === "specific" && Array.isArray(offer.applicableProducts)) {
        setSelectedProducts(offer.applicableProducts)
      }
    } catch (error) {
      console.error("Error fetching offer details:", error)
      toast.error("Failed to load offer details. Please try again.")
      navigate("/seller/offers")
    } finally {
      setFetchingOffer(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const openProductModal = () => {
    setIsModalOpen(true)
  }

  const handleProductSelection = (products) => {
    setSelectedProducts(products)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.amount || isNaN(formData.amount) || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid discount amount"
    } else if (formData.discountType === "percentage" && Number.parseFloat(formData.amount) > 100) {
      newErrors.amount = "Percentage discount cannot exceed 100%"
    }

    if (!formData.minPurchase || isNaN(formData.minPurchase) || Number.parseFloat(formData.minPurchase) < 0) {
      newErrors.minPurchase = "Please enter a valid minimum purchase amount"
    }

    if (formData.offerLimit && (isNaN(formData.offerLimit) || Number.parseInt(formData.offerLimit) < 0)) {
      newErrors.offerLimit = "Please enter a valid offer limit"
    }

    if (!formData.startingDate) {
      newErrors.startingDate = "Starting date is required"
    }

    if (!formData.closingDate) {
      newErrors.closingDate = "Closing date is required"
    } else if (formData.startingDate && new Date(formData.closingDate) < new Date(formData.startingDate)) {
      newErrors.closingDate = "Closing date must be after starting date"
    }

    if (formData.productScope === "specific" && selectedProducts.length === 0) {
      newErrors.productScope = "Please select at least one product"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      setLoading(true)

      // Prepare data for API
      const offerData = {
        title: formData.title,
        description: formData.description,
        discountType: formData.discountType,
        amount: Number.parseFloat(formData.amount),
        minPurchase: Number.parseFloat(formData.minPurchase),
        offerLimit: formData.offerLimit ? Number.parseInt(formData.offerLimit) : 0,
        startingDate: formData.startingDate,
        closingDate: formData.closingDate,
        applicableProducts: formData.productScope === "all" ? "all" : selectedProducts,
      }

      const response = await axios.put(`/api/offers/${id}`, offerData)

      toast.success("Offer updated successfully!")
      navigate("/seller/offers")
    } catch (error) {
      console.error("Error updating offer:", error)
      toast.error(error.response?.data?.error || "Failed to update offer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingOffer) {
    return (
      <div className="add-offer-container">
        <div className="loading-spinner">Loading offer details...</div>
      </div>
    )
  }

  return (
    <div className="add-offer-container">
      <div className="add-offer-header">
        <h1>Edit Offer</h1>
        <button className="back-button" onClick={() => navigate("/seller/offers")}>
          Back to Offers
        </button>
      </div>

      <form className="offer-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Offer Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Summer Sale, Weekend Special"
            className={errors.title ? "error" : ""}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your offer (optional)"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="discountType">Discount Type*</label>
            <select id="discountType" name="discountType" value={formData.discountType} onChange={handleChange}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Discount Amount*</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder={formData.discountType === "percentage" ? "e.g., 10" : "e.g., 100"}
              min="0"
              step={formData.discountType === "percentage" ? "1" : "0.01"}
              className={errors.amount ? "error" : ""}
            />
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="minPurchase">Minimum Purchase (₹)*</label>
            <input
              type="number"
              id="minPurchase"
              name="minPurchase"
              value={formData.minPurchase}
              onChange={handleChange}
              placeholder="e.g., 500"
              min="0"
              step="0.01"
              className={errors.minPurchase ? "error" : ""}
            />
            {errors.minPurchase && <div className="error-message">{errors.minPurchase}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="offerLimit">Usage Limit (Optional)</label>
            <input
              type="number"
              id="offerLimit"
              name="offerLimit"
              value={formData.offerLimit}
              onChange={handleChange}
              placeholder="Leave blank for unlimited"
              min="0"
              step="1"
              className={errors.offerLimit ? "error" : ""}
            />
            {errors.offerLimit && <div className="error-message">{errors.offerLimit}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startingDate">Starting Date*</label>
            <input
              type="date"
              id="startingDate"
              name="startingDate"
              value={formData.startingDate}
              onChange={handleChange}
              className={errors.startingDate ? "error" : ""}
            />
            {errors.startingDate && <div className="error-message">{errors.startingDate}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="closingDate">Closing Date*</label>
            <input
              type="date"
              id="closingDate"
              name="closingDate"
              value={formData.closingDate}
              onChange={handleChange}
              min={formData.startingDate || new Date().toISOString().split("T")[0]}
              className={errors.closingDate ? "error" : ""}
            />
            {errors.closingDate && <div className="error-message">{errors.closingDate}</div>}
          </div>
        </div>

        <div className="form-group product-scope-group">
          <label>Apply Offer To*</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="productScope"
                value="all"
                checked={formData.productScope === "all"}
                onChange={handleChange}
              />
              All Products
            </label>

            <label className="radio-label">
              <input
                type="radio"
                name="productScope"
                value="specific"
                checked={formData.productScope === "specific"}
                onChange={handleChange}
              />
              Specific Products
            </label>
          </div>

          {formData.productScope === "specific" && (
            <div className="product-selection">
              <button type="button" className="select-products-button" onClick={openProductModal}>
                {selectedProducts.length > 0 ? `${selectedProducts.length} Products Selected` : "Select Products"}
              </button>
              {errors.productScope && <div className="error-message">{errors.productScope}</div>}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate("/seller/offers")}>
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Updating..." : "Update Offer"}
          </button>
        </div>
      </form>

      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProductSelection}
        selectedProducts={selectedProducts}
      />
    </div>
  )
}

export default EditOffer

