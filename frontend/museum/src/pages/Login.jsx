// pages/Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLE_ROUTES = {
  admin:    "/admin",
  employee: "/employee-dashboard",
  member:   "/member-dashboard",
  visitor:  "/visitor-dashboard",
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <span style={{ fontSize: 11, color: "#dc2626", marginTop: 2, display: "block" }}>{msg}</span>;
}

export default function Login() {
  const [mode, setMode] = useState("login");

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const [signupData, setSignupData] = useState({
    first_name: "", last_name: "", email: "", password: "",
    confirm_password: "", phone_number: "", street_address: "",
    city: "", state: "", zip_code: "", date_of_birth: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      const userRole = data.role || "visitor";
      localStorage.setItem("token",      data.token);
      localStorage.setItem("role",       userRole);
      localStorage.setItem("user_id",    data.user_id);
      localStorage.setItem("user_email", email);
      navigate(ROLE_ROUTES[userRole] || "/");
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
      setLoading(false);
    }
  }

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: "" }));
  }

  function validateSignup() {
    const errs = {};
    if (!signupData.first_name.trim()) errs.first_name = "Required";
    if (!signupData.last_name.trim())  errs.last_name  = "Required";
    if (!signupData.email.trim())      errs.email      = "Required";
    if (!signupData.password)          errs.password   = "Required";
    else if (signupData.password.length < 6) errs.password = "Min. 6 characters";
    if (signupData.password !== signupData.confirm_password)
      errs.confirm_password = "Passwords do not match";
    if (signupData.phone_number) {
      const digits = signupData.phone_number.replace(/\D/g, "");
      if (digits.length !== 10) errs.phone_number = "Must be 10 digits";
    }
    if (signupData.zip_code && signupData.zip_code.length !== 5)
      errs.zip_code = "Must be 5 digits";
    return errs;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    const errs = validateSignup();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name:     signupData.first_name,
          last_name:      signupData.last_name,
          email:          signupData.email,
          password:       signupData.password,
          role:           "visitor",
          phone_number:   signupData.phone_number,
          street_address: signupData.street_address,
          city:           signupData.city,
          state:          signupData.state,
          zip_code:       signupData.zip_code,
          date_of_birth:  signupData.date_of_birth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      setSuccess("Account created! You can now sign in.");
      setMode("login");
      setEmail(signupData.email);
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-overlay"></div>
        <div className="login-hero-content">
          <h1>{mode === "login" ? "Welcome Back" : "Join the Museum"}</h1>
          <p>{mode === "login"
            ? "Sign in to access your museum experience"
            : "Create an account to get started"}</p>
        </div>
      </div>

      <div className="login-container">
        <div className="login-card">

          <div className="login-tabs">
            <button className={`login-tab ${mode === "login"  ? "active" : ""}`}
              onClick={() => { setMode("login");  setError(""); setSuccess(""); setFieldErrors({}); }}>
              Sign In
            </button>
            <button className={`login-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); setFieldErrors({}); }}>
              Create Account
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <>
              <div className="login-header">
                <h2>SIGN IN</h2>
                <p>Enter your credentials to continue</p>
              </div>
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@museum.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <PasswordInput
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                {success && <div className="success-message">{success}</div>}
                {error   && <div className="error-message">{error}</div>}
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <div className="login-footer">
                  <p>Don't have an account?{" "}
                    <button type="button" className="link-btn" onClick={() => setMode("signup")}>
                      Create one
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === "signup" && (
            <>
              <div className="login-header">
                <h2>CREATE ACCOUNT</h2>
                <p>Fill in your details to register</p>
              </div>
              <form className="login-form signup-form" onSubmit={handleSignup}>
                <div className="signup-grid">

                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="first_name" value={signupData.first_name}
                      onChange={handleSignupChange} placeholder="Jane" />
                    <FieldError msg={fieldErrors.first_name} />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input name="last_name" value={signupData.last_name}
                      onChange={handleSignupChange} placeholder="Doe" />
                    <FieldError msg={fieldErrors.last_name} />
                  </div>

                  <div className="form-group full">
                    <label>Email Address *</label>
                    <input name="email" type="email" value={signupData.email}
                      onChange={handleSignupChange} placeholder="jane@email.com" />
                    <FieldError msg={fieldErrors.email} />
                  </div>

                  <div className="form-group">
                    <label>Password * <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(min. 6 characters)</span></label>
                    <PasswordInput
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      placeholder="Min. 6 characters"
                    />
                    <FieldError msg={fieldErrors.password} />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <PasswordInput
                      name="confirm_password"
                      value={signupData.confirm_password}
                      onChange={handleSignupChange}
                      placeholder="Repeat password"
                    />
                    <FieldError msg={fieldErrors.confirm_password} />
                  </div>

                  <div className="form-group">
                    <label>Phone Number <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(10 digits)</span></label>
                    <PhoneInput
                      name="phone_number"
                      value={signupData.phone_number}
                      onChange={handleSignupChange}
                    />
                    <FieldError msg={fieldErrors.phone_number} />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input name="date_of_birth" type="date"
                      value={signupData.date_of_birth}
                      onChange={handleSignupChange} />
                  </div>

                  <div className="form-group full">
                    <label>Street Address</label>
                    <input name="street_address" value={signupData.street_address}
                      onChange={handleSignupChange} placeholder="123 Main St" />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={signupData.city}
                      onChange={handleSignupChange} placeholder="Houston" />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <StateSelect name="state" value={signupData.state} onChange={handleSignupChange} />
                  </div>

                  <div className="form-group">
                    <label>Zip Code <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(5 digits)</span></label>
                    <ZipInput name="zip_code" value={signupData.zip_code} onChange={handleSignupChange} />
                    <FieldError msg={fieldErrors.zip_code} />
                  </div>

                </div>
                {error   && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
                <div className="login-footer">
                  <p>Already have an account?{" "}
                    <button type="button" className="link-btn" onClick={() => setMode("login")}>
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}