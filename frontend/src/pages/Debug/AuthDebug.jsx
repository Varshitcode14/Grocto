"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../utils/api"
import "./Debug.css"

const AuthDebug = () => {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const data = await api.get("/api/debug/session")
      setSessionInfo(data)
      setSessionError(null)
    } catch (error) {
      setSessionError(error.message)
      setSessionInfo(null)
    }
  }

  const testEndpoint = async (endpoint) => {
    try {
      const data = await api.get(endpoint)
      setTestResult({
        endpoint,
        success: true,
        data,
      })
    } catch (error) {
      setTestResult({
        endpoint,
        success: false,
        error: error.message,
      })
    }
  }

  return (
    <div className="debug-container">
      <h1>Authentication Debug</h1>

      <section className="debug-section">
        <h2>User State</h2>
        {loading ? <p>Loading user state...</p> : <pre>{JSON.stringify(user, null, 2)}</pre>}
      </section>

      <section className="debug-section">
        <h2>Session Info</h2>
        <button onClick={checkSession} className="debug-button">
          Check Session
        </button>

        {sessionError && (
          <div className="debug-error">
            <p>Error: {sessionError}</p>
          </div>
        )}

        {sessionInfo && <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>}
      </section>

      <section className="debug-section">
        <h2>Test Endpoints</h2>
        <div className="debug-buttons">
          <button onClick={() => testEndpoint("/api/health")} className="debug-button">
            Test Health
          </button>
          <button onClick={() => testEndpoint("/api/check-auth")} className="debug-button">
            Test Auth
          </button>
          <button onClick={() => testEndpoint("/api/notifications")} className="debug-button">
            Test Notifications
          </button>
          <button onClick={() => testEndpoint("/api/cart")} className="debug-button">
            Test Cart
          </button>
        </div>

        {testResult && (
          <div className={`debug-result ${testResult.success ? "success" : "error"}`}>
            <h3>Test Result for {testResult.endpoint}</h3>
            {testResult.success ? (
              <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
            ) : (
              <p>Error: {testResult.error}</p>
            )}
          </div>
        )}
      </section>

      <section className="debug-section">
        <h2>Browser Info</h2>
        <p>
          <strong>User Agent:</strong> {navigator.userAgent}
        </p>
        <p>
          <strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? "Yes" : "No"}
        </p>
      </section>
    </div>
  )
}

export default AuthDebug

