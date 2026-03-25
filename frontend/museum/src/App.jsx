import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import "./styles/theme.css";
import "./App.css";

import Login from "./pages/Login";
import Home from "./pages/Home";
import ArtistsGallery from "./pages/ArtistsGallery";
import Artworks from "./pages/Artworks";
import Exhibitions from "./pages/Exhibitions";
import Events from "./pages/Events";
import GiftShopPage from "./pages/GiftShopPage";
import GiftShopCartPage from "./pages/GiftShopCartPage";
import GiftShopCheckoutPage from "./pages/GiftShopCheckoutPage";
import AdminDashboard from "./components/AdminDashboard";
import VisitorDashboard  from "./pages/VisitorDashboard";
import MemberDashboard   from "./pages/MemberDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"        element={<Home />} />
        <Route path="/home"    element={<Navigate to="/" replace />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/artists" element={<ArtistsGallery />} />
        <Route path="/artworks" element={<Artworks />} />
        <Route path="/exhibitions" element={<Exhibitions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/gift-shop" element={<GiftShopPage />} />
        <Route path="/gift-shop/cart" element={<GiftShopCartPage />} />
        <Route path="/gift-shop/checkout" element={<GiftShopCheckoutPage />} />
        {/* ── Visitor — logged in, role "visitor" ── */}
        <Route path="/visitor-dashboard"
          element={<ProtectedRoute requiredRole="visitor"><VisitorDashboard /></ProtectedRoute>} />

        {/* ── Member — logged in, role "member" ── */}
        <Route path="/member-dashboard"
          element={<ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>} />

        {/* ── Employee — logged in, role "employee" ── */}
        <Route path="/employee-dashboard"
          element={<ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>} />

        {/* ── Admin — logged in, role "admin" ── */}
        <Route path="/admin"
          element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;