"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./OfferBanner.css"

const OfferBanner = ({ storeId = null }) => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0)

  console.log("OfferBanner rendering, storeId:", storeId)

  useEffect(() => {
    console.log("OfferBanner useEffect running, fetching offers")
    fetchOffers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Auto-rotate offers every 5 seconds
  useEffect(() => {
    if (offers.length <= 1) return

    const interval = setInterval(() => {
      setCurrentOfferIndex((prevIndex) => (prevIndex + 1) % offers.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [offers.length])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      console.log("Fetching offers...")

      const url = storeId
        ? `https://grocto-backend.onrender.com/api/offers/store/${storeId}`
        : "https://grocto-backend.onrender.com/api/offers/active"

      console.log("Fetching from URL:", url)

      const response = await fetch(url, {
        credentials: "include",
      })

      console.log("API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Offers data:", data)

        if (data.offers && data.offers.length > 0) {
          // Process dates to ensure they're in IST
          const processedOffers = data.offers.map((offer) => ({
            ...offer,
            startingDate: formatDateToIST(offer.startingDate),
            closingDate: formatDateToIST(offer.closingDate),
          }))

          setOffers(processedOffers)
        } else {
          // No offers found
          setOffers([])
        }
      } else {
        // API error
        console.error("API error:", response.statusText)
        setOffers([])
      }
    } catch (error) {
      console.error("Error fetching offers:", error)
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  // Function to convert date to IST format
  const formatDateToIST = (dateString) => {
    if (!dateString) return ""

    // Create a date object with the input date
    const date = new Date(dateString)

    // Format the date to ISO string with IST timezone
    const options = { timeZone: "Asia/Kolkata" }
    return date.toLocaleDateString("en-IN", options)
  }

  if (loading) {
    return <div className="offer-banner-skeleton"></div>
  }

  if (offers.length === 0) {
    return null // Don't show anything if no offers
  }

  const currentOffer = offers[currentOfferIndex]
  console.log("Rendering offer:", currentOffer)

  return (
    <div className="offer-banner">
      <div className="offer-banner-content">
        <div className="offer-tag">Special Offer</div>
        <h3 className="offer-title">{currentOffer.title}</h3>
        <p className="offer-description">{currentOffer.description}</p>
        <div className="offer-details">
          <span className="offer-discount">
            {currentOffer.discountType === "percentage"
              ? `${currentOffer.amount}% OFF`
              : `₹${currentOffer.amount.toFixed(2)} OFF`}
          </span>
          <span className="offer-condition">Min. Purchase: ₹{currentOffer.minPurchase.toFixed(2)}</span>
        </div>

        {storeId ? (
          <Link to={`/student/store/${storeId}`} className="offer-btn">
            Shop Now
          </Link>
        ) : (
          <Link to={`/student/store/${currentOffer.storeId}`} className="offer-btn">
            Visit Store
          </Link>
        )}
      </div>

      {offers.length > 1 && (
        <div className="offer-indicators">
          {offers.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentOfferIndex ? "active" : ""}`}
              onClick={() => setCurrentOfferIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default OfferBanner

