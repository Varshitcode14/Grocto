"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "../../context/ModalContext"
import "./AddProduct.css" // Reuse the same CSS as AddProduct

const EditProduct = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showError, showSuccess } = useModal()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch product details")
      }

      const data = await response.json()
      const product = data.product

      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
      })

      if (product.image) {
        setCurrentImage(product.image)
        setImagePreview(product.image)
      }
    } catch (error) {
      showError("Error", error.message || "Failed to fetch product details")
      console.error("Error fetching product details:", error)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Create form data for file upload
      const productData = new FormData()
      productData.append("name", formData.name)
      productData.append("description", formData.description)
      productData.append("price", formData.price)
      productData.append("stock", formData.stock)

      if (image) {
        productData.append("image", image)
      }

      console.log("Updating product data:", {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        hasNewImage: !!image,
      })

      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "PUT",
        body: productData,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product")
      }

      console.log("Product updated successfully:", data)
      showSuccess("Product Updated", "Your product has been updated successfully!")

      // Redirect to inventory page
      navigate("/seller/inventory")
    } catch (error) {
      showError("Update Failed", error.message || "Error updating product")
      console.error("Error updating product:", error)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="add-product-page">
        <div className="container">
          <div className="loading">Loading product details...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="add-product-page">
      <div className="container">
        <div className="page-header">
          <h1>Edit Product</h1>
          <p>Update your product information</p>
        </div>

        <div className="product-form-container">
          <form className="product-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows="4"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (₹)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Product Image</label>
              <div className="image-upload">
                <input type="file" id="image" name="image" onChange={handleImageChange} accept="image/*" />
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview || "/placeholder.svg"} alt="Preview" />
                  ) : (
                    <div className="no-image">
                      <span>No image selected</span>
                      <small>Select an image to preview</small>
                    </div>
                  )}
                </div>
                {currentImage && !image && (
                  <p className="current-image-info">
                    <small>Current image will be kept if no new image is selected</small>
                  </p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/seller/inventory")}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Updating Product..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProduct

