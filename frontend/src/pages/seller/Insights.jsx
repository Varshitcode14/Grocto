"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./Insights.css"

const Insights = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [insights, setInsights] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProducts: [],
    topCustomers: [],
    salesByMonth: [],
    orderStatusDistribution: {},
  })
  const [timeRange, setTimeRange] = useState("month") // week, month, year, all

  useEffect(() => {
    if (!user || user.role !== "seller") {
      navigate("/signin")
      return
    }

    fetchInsights()
  }, [user, timeRange])

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/seller/insights?timeRange=${timeRange}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch insights")
      }

      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error fetching insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data for demonstration
  useEffect(() => {
    // This would be replaced by the actual API call in production
    const mockData = {
      totalSales: 156,
      totalRevenue: 12450.75,
      averageOrderValue: 79.81,
      topProducts: [
        { id: 1, name: "Organic Bananas", quantity: 42, revenue: 1260 },
        { id: 2, name: "Whole Wheat Bread", quantity: 38, revenue: 950 },
        { id: 3, name: "Farm Fresh Eggs", quantity: 35, revenue: 875 },
        { id: 4, name: "Almond Milk", quantity: 30, revenue: 750 },
        { id: 5, name: "Avocados", quantity: 28, revenue: 700 },
      ],
      topCustomers: [
        { id: 1, name: "Rahul Sharma", orders: 12, spent: 960 },
        { id: 2, name: "Priya Patel", orders: 10, spent: 850 },
        { id: 3, name: "Amit Kumar", orders: 8, spent: 720 },
        { id: 4, name: "Sneha Gupta", orders: 7, spent: 630 },
        { id: 5, name: "Vikram Singh", orders: 6, spent: 540 },
      ],
      salesByMonth: [
        { month: "Jan", sales: 42, revenue: 3360 },
        { month: "Feb", sales: 38, revenue: 3040 },
        { month: "Mar", sales: 45, revenue: 3600 },
        { month: "Apr", sales: 40, revenue: 3200 },
        { month: "May", sales: 35, revenue: 2800 },
        { month: "Jun", sales: 48, revenue: 3840 },
      ],
      orderStatusDistribution: {
        pending: 15,
        accepted: 25,
        packaging: 20,
        delivering: 30,
        delivered: 60,
        rejected: 6,
      },
    }

    setInsights(mockData)
    setIsLoading(false)
  }, [timeRange])

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
  }

  if (isLoading) {
    return (
      <div className="insights-page loading">
        <div className="loading-spinner"></div>
        <p>Loading insights...</p>
      </div>
    )
  }

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1>Business Insights</h1>
        <div className="time-range-selector">
          <button className={timeRange === "week" ? "active" : ""} onClick={() => handleTimeRangeChange("week")}>
            This Week
          </button>
          <button className={timeRange === "month" ? "active" : ""} onClick={() => handleTimeRangeChange("month")}>
            This Month
          </button>
          <button className={timeRange === "year" ? "active" : ""} onClick={() => handleTimeRangeChange("year")}>
            This Year
          </button>
          <button className={timeRange === "all" ? "active" : ""} onClick={() => handleTimeRangeChange("all")}>
            All Time
          </button>
        </div>
      </div>

      <div className="insights-overview">
        <div className="insight-card">
          <h3>Total Sales</h3>
          <p className="insight-value">{insights.totalSales}</p>
          <p className="insight-label">orders</p>
        </div>
        <div className="insight-card">
          <h3>Total Revenue</h3>
          <p className="insight-value">₹{insights.totalRevenue.toFixed(2)}</p>
          <p className="insight-label">earned</p>
        </div>
        <div className="insight-card">
          <h3>Average Order Value</h3>
          <p className="insight-value">₹{insights.averageOrderValue.toFixed(2)}</p>
          <p className="insight-label">per order</p>
        </div>
      </div>

      <div className="insights-details">
        <div className="insights-section">
          <h2>Top Products</h2>
          <div className="insights-table-container">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {insights.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>₹{product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="insights-section">
          <h2>Top Customers</h2>
          <div className="insights-table-container">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {insights.topCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.orders}</td>
                    <td>₹{customer.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="insights-charts">
        <div className="insights-section">
          <h2>Sales Trend</h2>
          <div className="chart-container">
            <div className="bar-chart">
              {insights.salesByMonth.map((data) => (
                <div className="bar-container" key={data.month}>
                  <div
                    className="bar"
                    style={{
                      height: `${(data.sales / Math.max(...insights.salesByMonth.map((d) => d.sales))) * 100}%`,
                    }}
                  >
                    <span className="bar-value">{data.sales}</span>
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="insights-section">
          <h2>Order Status Distribution</h2>
          <div className="chart-container">
            <div className="status-distribution">
              {Object.entries(insights.orderStatusDistribution).map(([status, count]) => (
                <div className="status-item" key={status}>
                  <div className="status-label">
                    <span className={`status-dot ${status}`}></span>
                    <span className="status-name">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </div>
                  <div className="status-bar-container">
                    <div
                      className="status-bar"
                      style={{
                        width: `${
                          (count /
                            Object.values(insights.orderStatusDistribution).reduce(
                              (sum, current) => sum + current,
                              0,
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                    <span className="status-count">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights

