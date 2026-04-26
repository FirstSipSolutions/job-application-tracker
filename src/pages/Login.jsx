import Aurora from "../components/effects/Aurora.jsx";
import { useState } from "react";
import "../styles/login.css";
// import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Prevents the page from refreshing

    console.log("Attempting login with:", { email, password });

    // TODO: Logic to verify user and save token will go here
  };
  return (
    <>
      <Aurora
        colorStops={["#0a2a3a", "#0d6e8a", "#1a3a4a"]}
        blend={0.4}
        amplitude={1.2}
        speed={0.5}
      />
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1>JobTracker</h1>
            <p>Access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn">
              Sign in
            </button>
          </form>

          <div className="login-footer">
            <a href="/signup">Create account</a>
            <a href="/">Go back</a>
          </div>
        </div>
      </div>
    </>
  );
}
