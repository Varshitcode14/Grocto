/**
 * API utility functions for making requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://grocto-backend.onrender.com"

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem("authToken")
const setAuthToken = (token) => localStorage.setItem("authToken", token)
const removeAuthToken = () => localStorage.removeItem("authToken")

/**
 * Make a fetch request with the appropriate credentials and headers
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchWithCredentials = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Add auth token if available
  const token = getAuthToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Ensure credentials are always included
  const fetchOptions = {
    ...options,
    credentials: "include",
    headers,
  }

  try {
    const response = await fetch(url, fetchOptions)

    // For debugging
    console.log(`API ${options.method || "GET"} ${endpoint} status:`, response.status)

    if (!response.ok) {
      if (response.status === 401) {
        // If unauthorized and we have a token, try to clear it
        if (token) {
          console.log("Auth token may be invalid, clearing...")
          removeAuthToken()
        }
      }

      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    // Check for token in response headers
    const authToken = response.headers.get("X-Auth-Token")
    if (authToken) {
      setAuthToken(authToken)
    }

    return response.json()
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error)
    throw error
  }
}

/**
 * Helper functions for common API operations
 */
export const api = {
  get: (endpoint) => fetchWithCredentials(endpoint),

  post: (endpoint, data) =>
    fetchWithCredentials(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    fetchWithCredentials(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    fetchWithCredentials(endpoint, {
      method: "DELETE",
    }),

  // Special case for form data (file uploads)
  postFormData: async (endpoint, formData) => {
    const url = `${API_BASE_URL}${endpoint}`

    // Add auth token if available
    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: formData, // Don't set Content-Type header for multipart/form-data
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      // Check for token in response headers
      const authToken = response.headers.get("X-Auth-Token")
      if (authToken) {
        setAuthToken(authToken)
      }

      return response.json()
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error)
      throw error
    }
  },

  // Auth token management
  setAuthToken,
  getAuthToken,
  removeAuthToken,
}

export default api

