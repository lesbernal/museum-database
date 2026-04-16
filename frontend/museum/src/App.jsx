// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import "./styles/theme.css";
import "./App.css";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Visit from "./pages/Visit";
import ArtistsGallery from "./pages/ArtistsGallery";
import Artworks from "./pages/Artworks";
import Exhibitions from "./pages/Exhibitions";
import Events from "./pages/Events";
import Buildings from "./pages/Buildings";
import CafePage from "./pages/CafePage";
import CafeCartPage from "./pages/CafeCartPage";
import GiftShopPage from "./pages/GiftShopPage";
import GiftShopCartPage from "./pages/GiftShopCartPage";
import AdminDashboard from "./components/AdminDashboard";
import TicketPage from "./pages/Tickets";
import DonationPage from "./pages/Donations";
import VisitorDashboard from "./pages/VisitorDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MembershipPage from "./pages/MembershipPage";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/visit" element={<Visit />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artists" element={<ArtistsGallery />} />
        <Route path="/artworks" element={<Artworks />} />
        <Route path="/exhibitions" element={<Exhibitions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/tickets" element={<TicketPage />} />
        <Route path="/donations" element={<DonationPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Cafe Routes */}
        <Route path="/cafe" element={<CafePage />} />
        <Route path="/cafe/cart" element={<CafeCartPage />} />
        <Route path="/cafe/checkout" element={<Navigate to="/cafe/cart" replace />} />
        
        {/* Gift Shop Routes */}
        <Route path="/gift-shop" element={<GiftShopPage />} />
        <Route path="/gift-shop/cart" element={<GiftShopCartPage />} />
        <Route path="/gift-shop/checkout" element={<Navigate to="/gift-shop/cart" replace />} />

        {/* ── Protected Routes by Role ── */}
        
        {/* Visitor — logged in, role "visitor" */}
        <Route path="/visitor-dashboard"
          element={<ProtectedRoute requiredRole="visitor"><VisitorDashboard /></ProtectedRoute>} />

        {/* Member — logged in, role "member" */}
        <Route path="/member-dashboard"
          element={<ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>} />

        {/* Employee — logged in, role "employee" */}
        <Route path="/employee-dashboard"
          element={<ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>} />

        {/* Admin — logged in, role "admin" */}
        <Route path="/admin"
          element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;