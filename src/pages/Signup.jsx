import Aurora from "../components/effects/Aurora.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const PALETTE = {
  text: "#e8e2d9",
  textDim: "rgba(232, 226, 217, 0.65)",
  accent: "#c9a96e",
  panel: "rgba(20, 16, 12, 0.55)",
  panelBorder: "rgba(255, 235, 200, 0.08)",
};

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleGoogle = () => supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/app` },
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(" ");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      console.error("Signup: Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setErrorMsg("Error signup: User could not be created.");
      console.error(error);
      return;
    }

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
        <div className="signup-page">
          <div
            className="signup-container"
            style={{
              background: PALETTE.panel,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${PALETTE.panelBorder}`,
              borderRadius: 16,
              padding: "48px 40px",
            }}
          >
            <div className="signup-header">
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "8px",
                }}
              >
                Job
                <span
                  style={{
                    color: PALETTE.accent,
                    fontWeight: 500,
                  }}
                >
                  Tracker
                </span>
              </h1>
              <p
                style={{
                  color: PALETTE.accent,
                  fontWeight: 500,
                  margin: "8px",
                }}
              >
                Sign up below!
              </p>
            </div>

            <form onSubmit={handleSignup} className="signup-form">
              {/* First name input */}
              <div className="form-input-row">
                <label
                  htmlFor="firstName"
                  style={{
                    margin: "8px",
                  }}
                >
                  First
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                      margin: "8px",
                    }}
                  >
                    Name
                  </span>
                </label>
                <input
                  className="firstName"
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              {/* Last name input */}
              <div className="form-input-row">
                <label
                  htmlFor="lastName"
                  style={{
                    margin: "8px",
                  }}
                >
                  Last
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                    }}
                  >
                    Name
                  </span>
                </label>
                <input
                  className="lastName"
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* Email input */}
              <div className="form-input-row">
                <label
                  htmlFor="email"
                  style={{
                    margin: "8px",
                  }}
                >
                  Email
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                    }}
                  >
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

              {/* Password input */}
              <div className="form-input-row">
                <label
                  htmlFor="password"
                  style={{
                    margin: "8px",
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

              {/* Confine password input  */}
              <div className="form-input-row">
                <label
                  htmlFor="confirmPassword"
                  style={{
                    margin: "8px",
                  }}
                >
                  Confirm{" "}
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                    }}
                  >
                    Password
                  </span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {errorMsg && (
                <p style={{ color: "#d96b6b", fontSize: 13, margin: "8px 0" }}>
                  {errorMsg}
                </p>
              )}

              <div className="signup-container-buttons">
                <CTA to="/">Go back</CTA>
                <CTA to="/login">Log In</CTA>
                <SubmitButton>Sign up</SubmitButton>
              </div>

              <div style={{ textAlign: "center", margin: "16px 0 4px", color: PALETTE.textDim, fontSize: 11 }}>or</div>

              <GoogleButton onClick={handleGoogle} />
            </form>
          </div>
        </div>
      </main>
    </>
  );

  // Submit button function
  function SubmitButton({ children, subtle }) {
    return (
      <button
        type="submit"
        onSubmit={handleSignup}
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
}

// Link function
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

function GoogleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "10px 16px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "#fff", color: "#3c4043",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    </button>
  );
}
