import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import LogoutModal from "../modals/LogoutModal.jsx";

export default function AppNav({ onAddApp, onAddEvent }) {
  const { pathname }       = useLocation();
  const navigate           = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  function active(path) {
    return pathname === path ? " active" : "";
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <>
      <nav className="db-nav">
        <Link to="/" className="db-nav-brand">AppTrack</Link>

        <div className="db-nav-links">
          <Link to="/app"          className={`db-nav-link${active("/app")}`}>Dashboard</Link>
          <Link to="/app/calendar" className={`db-nav-link${active("/app/calendar")}`}>Calendar</Link>
          <Link to="/app/settings" className={`db-nav-link${active("/app/settings")}`}>Settings</Link>
        </div>

        <div className="db-nav-actions">
          {pathname === "/app"          && <button className="db-nav-add"                   onClick={onAddApp}>+ Add Application</button>}
          {pathname === "/app/calendar" && <button className="db-nav-add db-nav-add-green"  onClick={onAddEvent}>+ Add Event</button>}
          {pathname === "/app/settings" && <button className="db-nav-add db-nav-add-red"    onClick={() => setShowLogout(true)}>Log out</button>}
          <ThemeToggle />
        </div>
      </nav>

      {showLogout && (
        <LogoutModal onConfirm={logout} onClose={() => setShowLogout(false)} />
      )}
    </>
  );
}
