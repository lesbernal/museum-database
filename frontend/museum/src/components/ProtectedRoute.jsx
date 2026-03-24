import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  console.log("ProtectedRoute - token:", token);
  console.log("ProtectedRoute - role:", role);
  console.log("ProtectedRoute - requiredRole:", requiredRole);

  // Check if user is logged in
  if (!token) {
    console.log("No token, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && role !== requiredRole) {
    console.log(`Role mismatch. Required: ${requiredRole}, Got: ${role}, redirecting to home`);
    return <Navigate to="/" replace />;
  }

  console.log("Access granted");
  return children;
}