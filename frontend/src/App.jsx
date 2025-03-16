import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import LandingPage from "./pages/LandingPage"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import StudentDashboard from "./pages/student/Dashboard"
import ProductList from "./pages/student/ProductList"
import Cart from "./pages/student/Cart"
import SellerDashboard from "./pages/seller/Dashboard"
import InventoryManagement from "./pages/seller/InventoryManagement"
import AddProduct from "./pages/seller/AddProduct"
import ProfileSettings from "./pages/seller/ProfileSettings"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

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

            {/* Redirect to appropriate dashboard if logged in */}
            <Route path="/dashboard" element={<Navigate to="/student" />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

