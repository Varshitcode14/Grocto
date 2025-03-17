/**
 * Utility functions for date and time formatting in IST (Indian Standard Time)
 */

// IST offset in milliseconds (5 hours and 30 minutes)
const IST_OFFSET = (5 * 60 + 30) * 60 * 1000

/**
 * Converts a UTC date to IST date
 * @param {Date|string} date - Date object or date string
 * @returns {Date} - Date object in IST
 */
export const convertToIST = (date) => {
  const utcDate = new Date(date)
  return new Date(utcDate.getTime() + IST_OFFSET)
}

/**
 * Formats a date string to Indian Standard Time (IST) with full format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string in IST
 */
export const formatToIST = (dateString) => {
  // Create date object from the UTC string
  const istDate = convertToIST(dateString)

  // Format the IST date for display
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const day = istDate.getDate()
  const month = months[istDate.getMonth()]
  const year = istDate.getFullYear()

  // Format time with AM/PM
  let hours = istDate.getHours()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const minutes = istDate.getMinutes().toString().padStart(2, "0")

  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm} (IST)`
}

/**
 * Formats a date string to a short IST format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string in short IST format
 */
export const formatToShortIST = (dateString) => {
  const istDate = convertToIST(dateString)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = istDate.getDate()
  const month = months[istDate.getMonth()]
  const year = istDate.getFullYear()

  let hours = istDate.getHours()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  hours = hours ? hours : 12
  const minutes = istDate.getMinutes().toString().padStart(2, "0")

  return `${day} ${month}, ${year} ${hours}:${minutes} ${ampm} (IST)`
}

/**
 * Formats a date string to a relative time format (e.g., "2 hours ago")
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string in relative time format
 */
export const formatToRelativeTime = (dateString) => {
  // Create date object from the UTC string and convert to IST
  const istDate = convertToIST(dateString)

  // Get current time in IST
  const now = new Date()
  const istNow = new Date(now.getTime() + IST_OFFSET)

  const diffMs = istNow - istDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) {
    return "Just now"
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago (IST)`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago (IST)`
  } else {
    // For older dates, use the standard IST format
    return formatToShortIST(dateString)
  }
}

