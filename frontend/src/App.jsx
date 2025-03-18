"use client"

import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ModalProvider } from "./context/ModalContext"
import Navbar from "./components/Navbar"
import LandingPage from "./pages/LandingPage"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import StudentDashboard from "./pages/student/Dashboard"
import StoreList from "./pages/student/StoreList"
import StoreProducts from "./pages/student/StoreProducts"
import ProductList from "./pages/student/ProductList"
import Cart from "./pages/student/Cart"
import Checkout from "./pages/student/Checkout"
import OrderConfirmation from "./pages/student/OrderConfirmation"
import OrdersList from "./pages/student/OrdersList"
import UserProfile from "./pages/student/StudentProfile"
import SellerDashboard from "./pages/seller/Dashboard"
import InventoryManagement from "./pages/seller/InventoryManagement"
import AddProduct from "./pages/seller/AddProduct"
import EditProduct from "./pages/seller/EditProduct"
import ProfileSettings from "./pages/seller/ProfileSettings"
import OrderManagement from "./pages/seller/OrderManagement"
import OrderDetail from "./pages/seller/OrderDetail"
import DeliverySlots from "./pages/seller/DeliverySlots"
import OffersList from "./pages/seller/OffersList"
import PostOffer from "./pages/seller/PostOffer"
import Debug from "./pages/Debug"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"

// Import the ErrorBoundary at the top of the file
import ErrorBoundary from "./components/ErrorBoundary"
// First, import the Insights component at the top of the file with the other imports:
import Insights from "./pages/seller/Insights"
import AuthDebug from "./pages/Debug/AuthDebug"

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth()

  if (user?.role === "student") return <Navigate to="/student" replace />
  if (user?.role === "seller") return <Navigate to="/seller" replace />
  return <Navigate to="/" replace />
}

// Landing page with auth check
const LandingPageWithAuthCheck = () => {
  const { user, checkAuthStatus } = useAuth()

  // Force auth check on landing page
  React.useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return <LandingPage />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModalProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPageWithAuthCheck />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="/debug/auth" element={<AuthDebug />} />

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
                <Route
                  path="/student/checkout"
                  element={
                    <ProtectedRoute role="student">
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/order-confirmation/:orderId"
                  element={
                    <ProtectedRoute role="student">
                      <OrderConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/orders"
                  element={
                    <ProtectedRoute role="student">
                      <OrdersList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/orders/:orderId"
                  element={
                    <ProtectedRoute role="student">
                      <OrderConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute role="student">
                      <UserProfile />
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
                {/* Add the new Insights route after the existing seller routes: */}
                <Route
                  path="/seller/insights"
                  element={
                    <ProtectedRoute role="seller">
                      <Insights />
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
                  path="/seller/edit-product/:productId"
                  element={
                    <ProtectedRoute role="seller">
                      <EditProduct />
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
                <Route
                  path="/seller/orders"
                  element={
                    <ProtectedRoute role="seller">
                      <OrderManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/orders/:orderId"
                  element={
                    <ProtectedRoute role="seller">
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/delivery-slots"
                  element={
                    <ProtectedRoute role="seller">
                      <DeliverySlots />
                    </ProtectedRoute>
                  }
                />
                {/* New Offer Routes */}
                <Route
                  path="/seller/offers"
                  element={
                    <ProtectedRoute role="seller">
                      <OffersList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/offers/new"
                  element={
                    <ProtectedRoute role="seller">
                      <ErrorBoundary>
                        <PostOffer />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/offers/edit/:offerId"
                  element={
                    <ProtectedRoute role="seller">
                      <ErrorBoundary>
                        <PostOffer />
                      </ErrorBoundary>
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
            </main>
            <Footer />
          </div>
        </ModalProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

