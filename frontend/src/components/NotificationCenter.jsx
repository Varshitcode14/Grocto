"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { formatToRelativeTime } from "../utils/dateUtils"
import "./NotificationCenter.css"

const NotificationCenter = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const notificationRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Set up polling for new notifications
      const interval = setInterval(() => {
        fetchUnreadCount()
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    // Close notification panel when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://grocto-backend.onrender.com/api/notifications", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications.filter((n) => !n.isRead).length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("https://grocto-backend.onrender.com/api/notifications?unread=true", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setUnreadCount(data.notifications.length)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const toggleNotifications = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
      // Make sure the panel is visible within the viewport
      setTimeout(() => {
        if (notificationRef.current) {
          const panel = notificationRef.current.querySelector(".notification-panel")
          if (panel) {
            const rect = panel.getBoundingClientRect()
            if (rect.right > window.innerWidth) {
              panel.style.right = "0"
              panel.style.left = "auto"
            }
            if (rect.bottom > window.innerHeight) {
              panel.style.maxHeight = `${window.innerHeight - rect.top - 20}px`
            }
          }
        }
      }, 0)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`https://grocto-backend.onrender.com/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      // Update local state
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getNotificationLink = (notification) => {
    if (notification.type === "order" && notification.referenceId) {
      return user.role === "student"
        ? `/student/orders/${notification.referenceId}`
        : `/seller/orders/${notification.referenceId}`
    }
    return "#"
  }

  return (
    <div className="notification-center" ref={notificationRef}>
      <button className="notification-button" onClick={toggleNotifications} aria-label="Notifications">
        {/* Use SVG instead of Font Awesome for reliability */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="notification-icon"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <Link to={getNotificationLink(notification)} className="notification-link">
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{formatToRelativeTime(notification.createdAt)}</span>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-notifications">No notifications yet</div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <Link
                to={user.role === "student" ? "/student/notifications" : "/seller/notifications"}
                className="view-all"
              >
                View All
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter

