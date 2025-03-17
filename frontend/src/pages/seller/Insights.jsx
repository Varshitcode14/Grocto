"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { format, subDays } from "date-fns"
import "./Insights.css"

const Insights = () => {
  const { user } = useAuth()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30") // Default to 30 days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    fetchInsights()
  }, [dateRange])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `http://localhost:5000/api/seller/insights?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59`,
        {
          credentials: "include",
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch insights")
      }

      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error fetching insights:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (e) => {
    const days = Number.parseInt(e.target.value)
    setDateRange(e.target.value)

    const end = new Date()
    const start = subDays(end, days)

    setStartDate(format(start, "yyyy-MM-dd"))
    setEndDate(format(end, "yyyy-MM-dd"))
  }

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-header">
          <h1>Store Insights</h1>
        </div>
        <div className="loading-container">
          <p>Loading insights...</p>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="insights-page">
        <div className="insights-header">
          <h1>Store Insights</h1>
        </div>
        <div className="loading-container">
          <p>No insights available. Try a different date range.</p>
        </div>
      </div>
    )
  }

  const { summary, statusCounts, topCustomers, topProducts, revenueTimeSeries, ordersTimeSeries } = insights

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1>Store Insights</h1>
        <div className="date-filter">
          <span>Time period:</span>
          <select value={dateRange} onChange={handleDateRangeChange}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="insights-grid">
        <div className="insight-card">
          <h3>Total Orders</h3>
          <div className="value">{summary.totalOrders}</div>
        </div>

        <div className="insight-card">
          <h3>Total Revenue</h3>
          <div className="value">{formatCurrency(summary.totalRevenue)}</div>
        </div>

        <div className="insight-card">
          <h3>Items Sold</h3>
          <div className="value">{summary.totalItemsSold}</div>
        </div>

        <div className="insight-card">
          <h3>Avg. Order Value</h3>
          <div className="value">{formatCurrency(summary.avgOrderValue)}</div>
        </div>
      </div>

      {/* Order Status */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Order Status</h2>
        </div>
        <div className="status-chart">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="status-item">
              <div className="status-count">{count}</div>
              <div className="status-label">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="table-container">
        <div className="table-header">
          <h2>Top Customers</h2>
          <Link to="/seller/customers" className="view-all">
            View All
          </Link>
        </div>
        <table className="insights-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.length > 0 ? (
              topCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.orderCount}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No customer data available for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Products Table */}
      <div className="table-container">
        <div className="table-header">
          <h2>Top Products</h2>
          <Link to="/seller/inventory" className="view-all">
            View All Products
          </Link>
        </div>
        <table className="insights-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length > 0 ? (
              topProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.quantitySold}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No product data available for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revenue Over Time */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Revenue Over Time</h2>
        </div>
        <div className="chart-content">
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            {revenueTimeSeries.length > 0 ? (
              <div>
                <p>Revenue chart would be displayed here</p>
                <p>Total revenue for period: {formatCurrency(summary.totalRevenue)}</p>
              </div>
            ) : (
              <p>No revenue data available for this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders Over Time */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Orders Over Time</h2>
        </div>
        <div className="chart-content">
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            {ordersTimeSeries.length > 0 ? (
              <div>
                <p>Orders chart would be displayed here</p>
                <p>Total orders for period: {summary.totalOrders}</p>
              </div>
            ) : (
              <p>No order data available for this period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights

