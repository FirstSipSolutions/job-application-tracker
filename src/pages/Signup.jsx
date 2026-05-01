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

              {/* Signup button container */}
              <div className="signup-container-buttons">
                <CTA to="/">Go back</CTA>
                <CTA to="/Login">Log In</CTA>
                <SubmitButton>Sign up!</SubmitButton>
              </div>
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
