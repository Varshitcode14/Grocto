"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
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
      const response = await fetch("http://localhost:5000/api/notifications", {
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
      const response = await fetch("http://localhost:5000/api/notifications?unread=true", {
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
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return "Just now"
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
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
        <i className="fas fa-bell"></i>
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
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
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

