"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ImageWithFallback from "../../components/ImageWithFallback"
import "./InventoryManagement.css"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const InventoryManagement = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleting, setDeleting] = useState({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

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

  const confirmDelete = (productId) => {
    setProductToDelete(productId)
    setDeleteModalOpen(true)
  }

  const deleteProduct = async () => {
    if (!productToDelete) return

    try {
      setLoading(true)
      const response = await fetch(`https://grocto-backend.onrender.com/api/products/${productToDelete}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete product")
      }

      // Remove the product from the state
      setProducts(products.filter((product) => product.id !== productToDelete))
      toast.success("Product deleted successfully")
      setDeleteModalOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error(error.message || "Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="inventory-page">
      <div className="container">
        <div className="page-header">
          <h1>Inventory Management</h1>
          <p>Manage your product inventory</p>
        </div>

        <div className="inventory-actions">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/seller/add-product" className="btn btn-primary">
            Add New Product
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="inventory-table">
            <div className="table-header">
              <div className="header-cell image-cell">Image</div>
              <div className="header-cell name-cell">Name</div>
              <div className="header-cell price-cell">Price</div>
              <div className="header-cell stock-cell">Stock</div>
              <div className="header-cell actions-cell">Actions</div>
            </div>

            {filteredProducts.map((product) => (
              <div key={product.id} className="table-row">
                <div className="cell image-cell">
                  {product.image ? (
                    <ImageWithFallback
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      height={80}
                      width={80}
                      fallbackSrc="/placeholder.svg?height=80&width=80"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="cell name-cell">
                  <h3>{product.name}</h3>
                  {product.description && <p className="product-description">{product.description}</p>}
                </div>
                <div className="cell price-cell">₹{product.price.toFixed(2)}</div>
                <div className="cell stock-cell">
                  <span className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
                    {product.stock > 0 ? product.stock : "Out of stock"}
                  </span>
                </div>
                <div className="cell actions-cell">
                  <Link to={`/seller/edit-product/${product.id}`} className="edit-btn">
                    Edit
                  </Link>
                  <button className="delete-btn" onClick={() => confirmDelete(product.id)} disabled={loading}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            {searchTerm ? "No products match your search." : "No products in your inventory yet."}
            <Link to="/seller/add-product" className="btn btn-primary">
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Delete</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setProductToDelete(null)
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={deleteProduct} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement

