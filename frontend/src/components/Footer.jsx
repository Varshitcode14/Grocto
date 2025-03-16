import { Link } from "react-router-dom"
import "./Footer.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-logo">
          <Link to="/" className="logo-link">
            <img src="/grocto-logo.svg" alt="Grocto" className="footer-logo-img" />
            <span className="footer-logo-text">Grocto</span>
          </Link>
          <p className="footer-tagline">Grocery delivery made easy for college students</p>
        </div>

        <div className="footer-links">
          <div className="footer-links-column">
            <h3 className="footer-links-title">Company</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-column">
            <h3 className="footer-links-title">Services</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/#how-it-works">How It Works</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-column">
            <h3 className="footer-links-title">Legal</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">&copy; {new Date().getFullYear()} Grocto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

