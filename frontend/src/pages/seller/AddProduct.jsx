"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./AddProduct.css"

const AddProduct = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
    setError("")

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

      console.log("Submitting product data:", {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        hasImage: !!image,
      })

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: productData,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product")
      }

      console.log("Product added successfully:", data)

      // Redirect to inventory page
      navigate("/seller/inventory")
    } catch (error) {
      setError(error.message || "Error adding product")
      console.error("Error adding product:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-product-page">
      <div className="container">
        <div className="page-header">
          <h1>Add New Product</h1>
          <p>Add a new product to your inventory</p>
        </div>

        {error && <div className="error-message">{error}</div>}

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
                {loading ? "Adding Product..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddProduct

