// pages/EmployeeDashboard.jsx
// PROTECTED — requires login with role "employee".
// Shell page: teammates will fill in employee-specific content.

import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function EmployeeDashboard() {
  const navigate  = useNavigate();
  const firstName = localStorage.getItem("user_email")?.split("@")[0] || "Employee";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  }

  return (
    <div className="dashboard-page employee-dashboard">
      <div className="dashboard-hero employee-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge employee-badge">Employee</span>
          <h1>Staff Portal</h1>
          <p>Manage schedules, access internal tools, and stay up to date.</p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">← Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="dashboard-placeholder">
          <div className="placeholder-icon">🗂️</div>
          <h2>Employee Dashboard</h2>
          <p>This area will contain staff features such as scheduling, department resources, and internal announcements.</p>
        </div>
      </div>
    </div>
  );
}