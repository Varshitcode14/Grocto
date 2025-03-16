"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import LandingPage from "./pages/LandingPage"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import StudentDashboard from "./pages/student/Dashboard"
import StoreList from "./pages/student/StoreList"
import StoreProducts from "./pages/student/StoreProducts"
import ProductList from "./pages/student/ProductList"
import Cart from "./pages/student/Cart"
import SellerDashboard from "./pages/seller/Dashboard"
import InventoryManagement from "./pages/seller/InventoryManagement"
import AddProduct from "./pages/seller/AddProduct"
import ProfileSettings from "./pages/seller/ProfileSettings"
import Debug from "./pages/Debug"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth()

  if (user?.role === "student") return <Navigate to="/student" />
  if (user?.role === "seller") return <Navigate to="/seller" />
  return <Navigate to="/" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/debug" element={<Debug />} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/stores"
              element={
                <ProtectedRoute role="student">
                  <StoreList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/store/:storeId"
              element={
                <ProtectedRoute role="student">
                  <StoreProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/products"
              element={
                <ProtectedRoute role="student">
                  <ProductList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/cart"
              element={
                <ProtectedRoute role="student">
                  <Cart />
                </ProtectedRoute>
              }
            />

            {/* Seller Routes */}
            <Route
              path="/seller"
              element={
                <ProtectedRoute role="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/inventory"
              element={
                <ProtectedRoute role="seller">
                  <InventoryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/add-product"
              element={
                <ProtectedRoute role="seller">
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/profile"
              element={
                <ProtectedRoute role="seller">
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

            {/* Dynamic dashboard redirect based on user role */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

