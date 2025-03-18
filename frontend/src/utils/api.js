import axios from "axios"

// Use the environment variable with a fallback to localhost for development
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:5000/api"

const api = axios.create({
  baseURL: baseURL, // Now using the environment variable
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle error globally here
    console.error("API Error:", error)
    return Promise.reject(error)
  },
)

// Add some debugging to help troubleshoot
console.log("API Base URL:", baseURL)

export default api