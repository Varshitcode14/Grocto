"use client"

import { useState, useEffect } from "react"
import "./ProductSelectionModal.css"

const ProductSelectionModal = ({ isOpen, onClose, onSave, selectedProducts = [] }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectAll, setSelectAll] = useState(false)

  // Initialize selected products from props
  useEffect(() => {
    setSelected(selectedProducts)
  }, [selectedProducts])

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

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
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProduct = (productId) => {
    setSelected((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleToggleAll = () => {
    if (selected.length === products.length) {
      // If all are selected, deselect all
      setSelected([])
      setSelectAll(false)
    } else {
      // Otherwise, select all
      setSelected(products.map((product) => product.id))
      setSelectAll(true)
    }
  }

  const handleSave = () => {
    onSave(selected)
    onClose()
  }

  // Filter products based on search term
  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="product-modal">
        <div className="modal-header">
          <h2>Select Products</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="select-all-row">
          <label>
            <input type="checkbox" checked={selectAll} onChange={handleToggleAll} />
            <span>{selectAll ? "Deselect All" : "Select All"}</span>
          </label>
          <span className="selected-count">
            {selected.length} of {products.length} selected
          </span>
        </div>

        <div className="product-list">
          {loading ? (
            <div className="loading-message">Loading products...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">No products found</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => handleToggleProduct(product.id)}
                  />
                  <div className="product-info">
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image || "/placeholder.svg"} alt={product.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="product-details">
                      <h3>{product.name}</h3>
                      <p className="product-price">₹{product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Selection ({selected.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductSelectionModal

