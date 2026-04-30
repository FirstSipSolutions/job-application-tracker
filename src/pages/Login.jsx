import Aurora from "../components/effects/Aurora.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { supabase } from "../lib/supabase.js";
import { useNavigate } from "react-router-dom";

const PALETTE = {
  text: "#e8e2d9",
  textDim: "rgba(232, 226, 217, 0.65)",
  accent: "#c9a96e",
  panel: "rgba(20, 16, 12, 0.55)",
  panelBorder: "rgba(255, 235, 200, 0.08)",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      console.error(error);
      return;
    }

    console.log("Login successful! Attempting to navigate...");
    navigate("/app");
  };

  return (
    <>
      <Aurora
        colorStops={["#0a2a3a", "#0d6e8a", "#1a3a4a"]}
        blend={0.4}
        amplitude={1.2}
        speed={0.5}
      />
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "64px 24px",
          color: PALETTE.text,
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <div className="login-page">
          <div
            className="login-container"
            style={{
              background: PALETTE.panel,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${PALETTE.panelBorder}`,
              borderRadius: 16,
              padding: "48px 40px",
            }}
          >
            <div className="login-header">
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "10px",
                }}
              >
                Job
                <span
                  style={{
                    color: PALETTE.accent,
                    fontWeight: 500,
                    margin: "10px",
                  }}
                >
                  Tracker
                </span>
              </h1>
              <p
                style={{
                  color: PALETTE.accent,
                  fontWeight: 500,
                  margin: "10px",
                }}
              >
                Access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-input-row">
                <label
                  htmlFor="email"
                  style={{
                    margin: "10px",
                  }}
                >
                  Email
                  <span style={{ color: PALETTE.accent, fontWeight: 500 }}>
                    Address
                  </span>
                </label>
                <input
                  className="email"
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-input-row">
                <label
                  htmlFor="password"
                  style={{
                    margin: "10px",
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* <button type="submit" className="login-submit-btn">
                Sign in
              </button> */}

              <div className="login-container-buttons">
                <CTA to="/">Go back</CTA>
                <CTA to="/signup">Create Account</CTA>
                <SubmitButton>Log In!</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
  function SubmitButton({ children, subtle }) {
    return (
      <button
        type="submit"
        onSubmit={handleLogin}
        style={{
          display: "inline-flex",
          alignItems: "center",
          margin: "5px",
          padding: "10px 20px",
          borderRadius: 10,
          border: `1px solid ${subtle ? "rgba(201,169,110,0.2)" : PALETTE.accent}`,
          color: subtle ? PALETTE.textDim : PALETTE.accent,
          background: subtle ? "transparent" : "rgba(180, 130, 70, 0.08)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {children}
      </button>
    );
  }

  function CTA({ to, children, subtle }) {
    return (
      <Link
        to={to}
        style={{
          display: "inline-flex",
          alignItems: "center",
          margin: "5px",
          padding: "10px 20px",
          borderRadius: 10,
          border: `1px solid ${subtle ? "rgba(201,169,110,0.2)" : PALETTE.accent}`,
          color: subtle ? PALETTE.textDim : PALETTE.accent,
          background: subtle ? "transparent" : "rgba(180, 130, 70, 0.08)",
          textDecoration: "none",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </Link>
    );
  }
}
