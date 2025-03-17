"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import OfferBanner from "../../components/OfferBanner"
import DebugOfferBanner from "../../components/DebugOfferBanner"
import "./StoreProducts.css"
import { useModal } from "../../context/ModalContext"

const StoreProducts = () => {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showError, showSuccess } = useModal()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [addingToCart, setAddingToCart] = useState({})
  const [cartStore, setCartStore] = useState(null)

  useEffect(() => {
    fetchStoreDetails()
    fetchProducts()
    checkCartStore()
  }, [storeId])

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch store details")
      }

      const data = await response.json()
      setStore(data.store)
    } catch (error) {
      setError(error.message || "Error fetching store details")
      console.error("Error fetching store details:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}/products`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      console.log("Store products fetched:", data.products)
      setProducts(data.products || [])
    } catch (error) {
      setError(error.message || "Error fetching products")
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkCartStore = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/cart/store", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setCartStore(data.storeId)
      }
    } catch (error) {
      console.error("Error checking cart store:", error)
    }
  }

  const addToCart = async (productId) => {
    try {
      // If cart has items from another store, confirm with user
      if (cartStore && cartStore !== Number.parseInt(storeId)) {
        const confirmChange = window.confirm(
          "Your cart contains items from another store. Adding this item will clear your current cart. Continue?",
        )
        if (!confirmChange) {
          return
        }
      }

      setAddingToCart((prev) => ({ ...prev, [productId]: true }))

      const response = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1, storeId }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product to cart")
      }

      showSuccess("Added to Cart", "Product has been added to your cart!")
    } catch (error) {
      showError("Add to Cart Failed", error.message || "Error adding product to cart")
      console.error("Error adding to cart:", error)
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!store && !loading) {
    return (
      <div className="container">
        <div className="error-message">Store not found</div>
        <button className="btn btn-primary" onClick={() => navigate("/student/stores")}>
          Back to Stores
        </button>
      </div>
    )
  }

  return (
    <div className="store-products-page">
      <div className="container">
        {store && (
          <div className="store-header">
            <h1>{store.name}</h1>
            <p className="store-address">
              <i className="fas fa-map-marker-alt"></i> {store.address}
            </p>
            <div className="store-info">
              <span className="store-hours">
                <i className="fas fa-clock"></i> Hours: {store.openingTime} - {store.closingTime}
              </span>
              <span className="store-days">
                <i className="fas fa-calendar"></i> Days: {store.workingDays}
              </span>
            </div>
            {store.phoneNumber && (
              <div className="store-contact">
                <i className="fas fa-phone"></i> Contact: {store.phoneNumber}
              </div>
            )}
          </div>
        )}

        {/* Display store-specific offers */}
        <OfferBanner storeId={storeId} />

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image ? (
                    <ImageWithFallback
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      height={200}
                      width={200}
                      fallbackSrc="/placeholder.svg?height=200&width=200"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  {product.description && <p className="product-description">{product.description}</p>}
                  <p className="product-price">₹{product.price.toFixed(2)}</p>
                  <p className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
                  <button
                    className="btn btn-primary add-to-cart-btn"
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock <= 0 || addingToCart[product.id]}
                  >
                    {addingToCart[product.id] ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            {searchTerm ? "No products match your search." : "No products available in this store yet."}
          </div>
        )}
      </div>

      {/* Add debug component */}
      <DebugOfferBanner />
    </div>
  )
}

export default StoreProducts

