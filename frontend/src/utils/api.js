// API configuration
const API_CONFIG = {
  BASE_URL: "https://grocto-backend.onrender.com",
  FRONTEND_URL: "https://grocto-frontend.onrender.com",
}

// Helper function to create full API URLs
export const apiUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`

export default API_CONFIG

