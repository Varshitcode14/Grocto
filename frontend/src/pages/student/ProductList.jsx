"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import OfferBanner from "../../components/OfferBanner"
import DebugOfferBanner from "../../components/DebugOfferBanner"
import "./ProductList.css"
import { useNavigate } from "react-router-dom"
import { useModal } from "../../context/ModalContext"

const ProductList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showError, showSuccess } = useModal()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [addingToCart, setAddingToCart] = useState({})
  const [cartStore, setCartStore] = useState(null)

  useEffect(() => {
    fetchProducts()
    checkCartStore()
  }, [])

  const checkCartStore = async () => {
    try {
      const response = await fetch("https://grocto-backend.onrender.com/api/cart/store", {
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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/products", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      console.log("Products fetched:", data.products)
      setProducts(data.products || [])
    } catch (error) {
      setError(error.message || "Error fetching products")
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId, sellerId) => {
    try {
      // If cart has items from another store, confirm with user
      if (cartStore && cartStore !== sellerId) {
        const confirmChange = window.confirm(
          "Your cart contains items from another store. Adding this item will clear your current cart. Continue?",
        )
        if (!confirmChange) {
          return
        }
      }

      setAddingToCart((prev) => ({ ...prev, [productId]: true }))

      const response = await fetch("https://grocto-backend.onrender.com/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to add to cart")
      }

      // Update cart store
      setCartStore(sellerId)

      // Show success message
      showSuccess("Added to Cart", "Product added to cart!")

      // Navigate to the store page
      navigate(`/student/store/${sellerId}`)
    } catch (error) {
      showError("Add to Cart Failed", error.message || "Error adding to cart")
      console.error("Error adding to cart:", error)
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller?.storeName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="product-list-page">
      <div className="container">
        <div className="page-header">
          <h1>Browse Products</h1>
          <p>Find groceries from local stores</p>
        </div>

        {/* Display global offers */}
        <OfferBanner />

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
                  {product.seller?.storeName && <p className="product-seller">by {product.seller.storeName}</p>}
                  {product.description && <p className="product-description">{product.description}</p>}
                  <p className="product-price">₹{product.price.toFixed(2)}</p>
                  <p className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
                  <button
                    className="btn btn-primary add-to-cart-btn"
                    onClick={() => addToCart(product.id, product.seller?.id)}
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
            {searchTerm ? "No products match your search." : "No products available yet."}
          </div>
        )}
      </div>

      {/* Add debug component */}
      <DebugOfferBanner />
    </div>
  )
}

export default ProductList

