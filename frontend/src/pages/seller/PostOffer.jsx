"use client";

import { useState } from "react";
//import { useNavigate } from "react-router-dom"
// import { useAuth } from "../../context/AuthContext"
import "./PostOffer.css";
import { ToastContainer, toast } from "react-toastify";

const PostOffer = () => {
  //const navigate = useNavigate()
  // const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    minPurchase: "",
    offerLimit: "",
    startingDate: "",
    closingDate: "",
    amount: "",
  });

  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      // Create form data for file upload
      const offerData = new FormData();
      offerData.append("title", formData.title);
      offerData.append("description", formData.description);
      offerData.append("minPurchase", formData.minPurchase);
      offerData.append("offerLimit", formData.offerLimit);
      offerData.append("startingDate", formData.startingDate);
      offerData.append("closingDate", formData.closingDate);
      offerData.append("amount", formData.amount);

      //   const response = await fetch("http://localhost:5000/api/offers", {
      //     method: "POST",
      //     body: offerData,
      //     credentials: "include",
      //   })

      //   if (!response.ok) {
      //     const data = await response.json()
      //     throw new Error(data.error || "Failed to post offer")
      //   }

      // Redirect to inventory page
      // navigate("/seller/inventory")
      toast.success("Offer posted successfully");
    } catch (error) {
      toast.error("Offer can not be posted");
      console.error("Error posting offer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-offer-page">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <div className="container">
        <div className="page-header">
          <h1>Post New offer</h1>
        </div>

        <div className="offer-form-container">
          <form className="offer-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Offer Title</label>
              <input
                type="text"
                id="name"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter Offer Title"
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
                placeholder="Enter offer description"
                rows="4"
              ></textarea>
            </div>

            <div className="discount">
              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label htmlFor="dsicounttype" style={{ margin: "0" }}>
                  Discount Type :
                </label>
                <select name="" id="">
                  <option value="Percentage" id="1">
                    Percentage
                  </option>
                  <option value="Fixed Amount" id="2">
                    Fixed Amount
                  </option>
                </select>
              </div>
              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label htmlFor="dsicounttype" style={{ margin: "0" }}>
                  Discount Amount :
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter Discount amount"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Minimum Purchase (₹)</label>
                <input
                  type="number"
                  id="price"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  placeholder="0"
                  step="1"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="products">Applicable Products</label>
                <input
                  type="text"
                  id="products"
                  name="products"
                  onChange={handleChange}
                  placeholder="Applicable products"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="offerLimit">Offer Limit</label>
                <input
                  type="number"
                  id="offerLimit"
                  name="offerLimit"
                  value={formData.offerLimit}
                  onChange={handleChange}
                  placeholder="0"
                  step="1"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ display: "flex" }}>
              <div className="form-group">
                <label htmlFor="startingDate">Starting Date</label>
                <input
                  type="date"
                  id="startingDate"
                  name="startingDate"
                  value={formData.startingDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="closingDate">Closing Date</label>
                <input
                  type="date"
                  id="closingDate"
                  name="closingDate"
                  value={formData.closingDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button1"
                // onClick={() => navigate("/seller/inventory")}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="button2" disabled={loading}>
                {loading ? "Posting Offer..." : "Post Offer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostOffer;