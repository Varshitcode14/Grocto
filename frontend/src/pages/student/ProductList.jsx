"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import "./ProductList.css"

const ProductList = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [addingToCart, setAddingToCart] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/products", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      setError(error.message || "Error fetching products")
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }))

      const response = await fetch("http://localhost:5000/api/cart", {
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

      // Show success message or notification
      alert("Product added to cart!")
    } catch (error) {
      setError(error.message || "Error adding to cart")
      console.error("Error adding to cart:", error)
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="product-list-page">
      <div className="container">
        <div className="page-header">
          <h1>Browse Products</h1>
          <p>Find groceries from local stores</p>
        </div>

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
                    <img src={`http://localhost:5000${product.image}`} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-seller">by {product.seller.storeName}</p>
                  {product.description && <p className="product-description">{product.description}</p>}
                  <p className="product-price">${product.price.toFixed(2)}</p>
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
            {searchTerm ? "No products match your search." : "No products available yet."}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductList

