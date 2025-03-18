/**
 * API utility functions for making requests to the backend
 */

const API_BASE_URL = "https://grocto-backend.onrender.com"

/**
 * Make a fetch request with the appropriate credentials and headers
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchWithCredentials = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  // Ensure credentials are always included
  const fetchOptions = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, fetchOptions)

    // For debugging
    console.log(`API ${options.method || "GET"} ${endpoint} status:`, response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
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

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData, // Don't set Content-Type header for multipart/form-data
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error)
      throw error
    }
  },
}

export default api

