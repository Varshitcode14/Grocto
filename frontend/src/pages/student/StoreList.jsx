"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./StoreList.css"

const StoreList = () => {
  const { user } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/stores", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch stores")
      }

      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      setError(error.message || "Error fetching stores")
      console.error("Error fetching stores:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="store-list-page">
      <div className="container">
        <div className="page-header">
          <h1>Browse Stores</h1>
          <p>Find your favorite grocery stores</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading stores...</div>
        ) : filteredStores.length > 0 ? (
          <div className="stores-grid">
            {filteredStores.map((store) => (
              <Link to={`/student/store/${store.id}`} key={store.id} className="store-card">
                <div className="store-details">
                  <h3>{store.name}</h3>
                  <p className="store-address">{store.address}</p>
                  <div className="store-info">
                    <span className="store-hours">
                      {store.openingTime} - {store.closingTime}
                    </span>
                    <span className="store-days">{store.workingDays}</span>
                  </div>
                  <div className="store-products-count">{store.productsCount} Products</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-stores">{searchTerm ? "No stores match your search." : "No stores available yet."}</div>
        )}
      </div>
    </div>
  )
}

export default StoreList

