import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust as necessary
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

export default api

