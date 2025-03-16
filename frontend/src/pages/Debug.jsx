"use client"

import { useState, useEffect } from "react"
import "./Debug.css"

const Debug = () => {
  const [uploadInfo, setUploadInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUploadInfo()
  }, [])

  const fetchUploadInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/debug/uploads", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch upload information")
      }

      const data = await response.json()
      setUploadInfo(data)
    } catch (error) {
      setError(error.message || "Error fetching upload information")
      console.error("Error fetching upload information:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="debug-page">
      <div className="container">
        <div className="page-header">
          <h1>Debug Information</h1>
          <p>View information about uploaded files</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading debug information...</div>
        ) : uploadInfo ? (
          <div className="debug-info">
            <div className="info-section">
              <h2>Upload Directory</h2>
              <p>{uploadInfo.upload_dir}</p>
            </div>

            <div className="info-section">
              <h2>Uploaded Files ({uploadInfo.files.length})</h2>
              {uploadInfo.files.length > 0 ? (
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadInfo.files.map((file) => (
                      <tr key={file.name}>
                        <td>{file.name}</td>
                        <td>{(file.size / 1024).toFixed(2)} KB</td>
                        <td>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <img src={file.url || "/placeholder.svg"} alt={file.name} className="file-preview" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No files have been uploaded yet.</p>
              )}
            </div>

            <button className="btn btn-primary" onClick={fetchUploadInfo}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="no-info">No debug information available.</div>
        )}
      </div>
    </div>
  )
}

export default Debug

