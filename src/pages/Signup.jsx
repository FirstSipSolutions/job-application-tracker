import Aurora from "../components/effects/Aurora.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
// import { useNavigate } from "react-router-dom";

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

  // const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault(); // Prevents the page from refreshing

    console.log("Attempting sign up with:", {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });

    // TODO: Logic to Sign up new users
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
                Sign up below!
              </p>
            </div>

            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-first-name">
                <label
                  htmlFor="firstName"
                  style={{
                    margin: "10px",
                  }}
                >
                  First
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                      margin: "10px",
                    }}
                  >
                    Name
                  </span>
                </label>
                <input
                  className="firstName"
                  id="firstName"
                  type="firstName"
                  placeholder="EX: John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-last-name">
                <label
                  htmlFor="lastName"
                  style={{
                    margin: "10px",
                  }}
                >
                  Last
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                      margin: "10px",
                    }}
                  >
                    Name
                  </span>
                </label>
                <input
                  className="lastName"
                  id="lastName"
                  type="lastName"
                  placeholder="EX: Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="form-email">
                <label
                  htmlFor="email"
                  style={{
                    margin: "10px",
                  }}
                >
                  Email
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                      margin: "10px",
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

              <div className="form-password">
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
              <div className="form-confirm-password">
                <label
                  htmlFor="confirmPassword"
                  style={{
                    margin: "10px",
                  }}
                >
                  Confirm{" "}
                  <span
                    style={{
                      color: PALETTE.accent,
                      fontWeight: 500,
                      margin: "10px",
                    }}
                  >
                    Password
                  </span>
                </label>
                <input
                  id="confirmPassword"
                  type="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="signup-container-buttons">
                <CTA to="/">Go back</CTA>
                <CTA to="/Login">Log In</CTA>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
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
