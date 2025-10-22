import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "./Slideauth.css";

export default function SlideAuth() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "employee",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/users/register", signupData);
      alert("Account created successfully!");
      setIsSignup(false);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/users/login", loginData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleForms = () => {
    setIsSignup(!isSignup);
  };

  return (
    <div className="main">
      <input
        type="checkbox"
        id="chk"
        aria-hidden="true"
        checked={isSignup}
        onChange={toggleForms}
      />

      {/* Signup Section */}
      <div className="signup">
        <form onSubmit={handleSignupSubmit}>
          <label htmlFor="chk" aria-hidden="true" onClick={toggleForms}>
            Sign up
          </label>

          {error && isSignup && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <input
            type="text"
            name="name"
            placeholder="Full name"
            required
            value={signupData.name}
            onChange={handleSignupChange}
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={signupData.email}
            onChange={handleSignupChange}
            disabled={loading}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            required
            value={signupData.phone}
            onChange={handleSignupChange}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={signupData.password}
            onChange={handleSignupChange}
            disabled={loading}
          />

          {/* Enhanced Role Select */}
          <div className="role-select-container">
            <select
              name="role"
              value={signupData.role}
              onChange={handleSignupChange}
              disabled={loading}
              className="role-select"
            >
              <option value="employee">👨‍💼 Employee</option>
              <option value="manager">👔 Manager</option>
            </select>
            <div className="select-arrow">▼</div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign up"}
          </button>
        </form>
      </div>

      {/* Login Section */}
      <div className="login">
        {/* Slide-up/down Icon */}
        <div className="slide-icon" onClick={toggleForms}>
          <span>{isSignup ? "▼" : "▲"}</span>
        </div>
        
        <form onSubmit={handleLoginSubmit}>
          <label htmlFor="chk" aria-hidden="true" onClick={toggleForms}>
            Login
          </label>

          {error && !isSignup && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={loginData.email}
            onChange={handleLoginChange}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={loginData.password}
            onChange={handleLoginChange}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}