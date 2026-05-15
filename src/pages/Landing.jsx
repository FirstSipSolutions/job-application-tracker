import { Link, Navigate } from "react-router-dom"; 
// Navigate added  redirects without a link click
import Aurora from "../components/effects/Aurora.jsx";


import { useAuth } from "../hooks/useAuth.js"; 
// pull in the current auth session
import "../styles/landing.css";

export default function Landing() {
  const { user, loading } = useAuth(); 
  // user will EQUAl logged-in user or null; loading = session still being checked

  if (loading) return null;
   // wait for Supabase to restore the session before deciding what to show

  if (user) return <Navigate to="/app" replace />;
   // already logged in, skip the landing page entirely

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
          Track your applications, stay on top of interviews,<br />
          and follow up on time. Built for the determined. 
        </p>
        <div className="land-cta-row">
          <Link to="/signup" className="land-cta-primary">Get Started Free</Link>
          <Link to="/login"  className="land-cta-ghost">Sign In</Link>
        </div>
      </section>
    </div>
  );
}
