"use client"

import { useState } from "react"

const DebugOfferBanner = () => {
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 9999,
          background: "#f0f0f0",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "5px 10px",
          fontSize: "12px",
        }}
      >
        Debug Offers
      </button>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: 9999,
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "15px",
        width: "300px",
        maxHeight: "400px",
        overflowY: "auto",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <h3 style={{ margin: 0 }}>Debug Offers</h3>
        <button onClick={() => setIsVisible(false)}>Close</button>
      </div>

      <div>
        <h4>Test Offer Banner</h4>
        <div className="offer-banner">
          <div className="offer-banner-content">
            <div className="offer-tag">Special Offer</div>
            <h3 className="offer-title">Welcome Offer</h3>
            <p className="offer-description">Get 10% off on your first order</p>
            <div className="offer-details">
              <span className="offer-discount">10% OFF</span>
              <span className="offer-condition">Min. Purchase: ₹500.00</span>
            </div>
            <button className="offer-btn">Shop Now</button>
          </div>
        </div>

        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => {
              const banner = document.querySelector(".offer-banner")
              console.log("Banner element:", banner)
              console.log("Banner styles:", banner ? getComputedStyle(banner) : "Not found")
            }}
          >
            Log Banner Element
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugOfferBanner

