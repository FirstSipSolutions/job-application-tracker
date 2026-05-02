import { Link } from "react-router-dom";
import Aurora from "../components/effects/Aurora.jsx";
import "../styles/landing.css";

export default function Landing() {
  return (
    <div className="land-root">
      <div className="land-aurora-wrap" aria-hidden="true">
        <Aurora
          colorStops={["#2a0f08", "#8b3a1a", "#c97a45"]}
          blend={0.6}
          amplitude={1.0}
          speed={0.3}
        />
      </div>

      <div className="land-overlay" />

      <nav className="land-nav">
        <span className="land-nav-brand">AppTrack</span>
        <Link to="/login" className="land-nav-link">Sign in</Link>
      </nav>

      <section className="land-hero">
        <h1 className="land-headline">Your Job Hunt,<br />Simplified.</h1>
        <p className="land-sub">
          Track every application, stay on top of interviews,<br />
          and follow up on time. Built for job seekers who mean business.
        </p>
        <div className="land-cta-row">
          <Link to="/signup" className="land-cta-primary">Get Started Free</Link>
          <Link to="/login"  className="land-cta-ghost">Sign In</Link>
        </div>
      </section>
    </div>
  );
}
