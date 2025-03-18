"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "../../context/ModalContext"
import "./OffersList.css"

const OffersList = () => {
  const { user } = useAuth()
  const { showError, showSuccess } = useModal()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState({})

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/offers", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch offers")
      }

      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      setError(error.message || "Error fetching offers")
      console.error("Error fetching offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) {
      return
    }

    try {
      setDeleting((prev) => ({ ...prev, [offerId]: true }))

      const response = await fetch(`https://grocto-backend.onrender.com/api/offers/${offerId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete offer")
      }

      // Remove offer from state
      setOffers(offers.filter((o) => o.id !== offerId))
      showSuccess("Success", "Offer deleted successfully")
    } catch (error) {
      showError("Error", "Failed to delete offer: " + error.message)
      console.error("Error deleting offer:", error)
    } finally {
      setDeleting((prev) => ({ ...prev, [offerId]: false }))
    }
  }

  const formatDate = (dateString) => {
    // Format date to IST
    const date = new Date(dateString)

    // Format options for IST display
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata", // IST timezone
    }

    return date.toLocaleDateString("en-IN", options)
  }

  const isOfferActive = (offer) => {
    // Get current date in IST
    const now = new Date()
    const istOptions = { timeZone: "Asia/Kolkata" }
    const istDateStr = now.toLocaleDateString("en-IN", istOptions)
    const istDate = new Date(istDateStr)

    const startDate = new Date(offer.startingDate)
    const endDate = new Date(offer.closingDate)

    return istDate >= startDate && istDate <= endDate
  }

  return (
    <div className="offers-list-page">
      <div className="container">
        <div className="page-header">
          <h1>Manage Offers</h1>
          <p>Create and manage special offers for your customers (All dates are in IST)</p>
        </div>

        <div className="offers-actions">
          <Link to="/seller/offers/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add New Offer
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading offers...</div>
        ) : offers.length > 0 ? (
          <div className="offers-grid">
            {offers.map((offer) => (
              <div key={offer.id} className={`offer-card ${isOfferActive(offer) ? "active" : "inactive"}`}>
                <div className="offer-header">
                  <h3>{offer.title}</h3>
                  <div className={`offer-status ${isOfferActive(offer) ? "active" : "inactive"}`}>
                    {isOfferActive(offer) ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="offer-details">
                  <p className="offer-description">{offer.description}</p>

                  <div className="offer-info">
                    <div className="info-item">
                      <span className="info-label">Discount:</span>
                      <span className="info-value">
                        {offer.discountType === "percentage"
                          ? `${offer.amount}% off`
                          : `₹${offer.amount.toFixed(2)} off`}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Min Purchase:</span>
                      <span className="info-value">₹{offer.minPurchase.toFixed(2)}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Validity (IST):</span>
                      <span className="info-value">
                        {formatDate(offer.startingDate)} - {formatDate(offer.closingDate)}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Usage Limit:</span>
                      <span className="info-value">
                        {offer.usageCount || 0}/{offer.offerLimit}
                      </span>
                    </div>
                  </div>

                  <div className="offer-products">
                    <span className="info-label">Applicable to:</span>
                    <span className="info-value">
                      {offer.applicableProducts === "all"
                        ? "All products"
                        : `${offer.applicableProducts.length} specific products`}
                    </span>
                  </div>
                </div>

                <div className="offer-actions">
                  <Link to={`/seller/offers/edit/${offer.id}`} className="btn btn-outline btn-sm">
                    Edit
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteOffer(offer.id)}
                    disabled={deleting[offer.id]}
                  >
                    {deleting[offer.id] ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-offers">
            <div className="empty-state">
              <i className="fas fa-tag empty-icon"></i>
              <h3>No Offers Yet</h3>
              <p>Create special offers to attract more customers and boost your sales.</p>
              <Link to="/seller/offers/new" className="btn btn-primary">
                Post Your First Offer
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OffersList

