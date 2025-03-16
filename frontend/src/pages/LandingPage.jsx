import { Link } from "react-router-dom"
import "./LandingPage.css"

const LandingPage = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Grocery Delivery Made Easy for College Students</h1>
            <p className="hero-subtitle">
              Get groceries delivered to your dorm or apartment from local stores. Save time, eat better, focus on what
              matters.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary hero-btn">
                Get Started
              </Link>
              <Link to="/#how-it-works" className="btn btn-outline hero-btn">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features" id="features">
        <div className="container">
          <h2 className="section-title">Why Choose Grocto?</h2>
          <p className="section-subtitle">Designed specifically for busy college students</p>

          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-title">Save Time</h3>
              <p className="feature-description">
                Skip the trip to the store and focus on your studies. Get groceries delivered right to your door.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Student Discounts</h3>
              <p className="feature-description">
                Enjoy special pricing and promotions exclusively for college students.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Local Stores</h3>
              <p className="feature-description">
                Order from your favorite local grocery stores, including campus markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to simplify grocery shopping?</h2>
            <p className="cta-subtitle">Join thousands of college students who save time with Grocto.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary cta-btn">
                Sign Up Now
              </Link>
              <Link to="/signin" className="btn btn-outline cta-btn">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage

