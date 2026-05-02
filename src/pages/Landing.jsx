import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function Landing() {
  return (
    <div className="land-root">
      <div className="land-aurora" aria-hidden="true">
        <div className="land-blob land-blob-1" />
        <div className="land-blob land-blob-2" />
        <div className="land-blob land-blob-3" />
      </div>

      <nav className="land-nav">
        <span className="land-nav-brand">AppTrack</span>
        <div className="land-nav-links">
          <Link to="/login"  className="land-nav-link">Sign in</Link>
          <Link to="/signup" className="land-nav-cta">Sign up</Link>
        </div>
      </nav>
    </div>
  );
}
