// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";  // Add this import
import "./styles/theme.css"; 
import "./App.css";

import Login from "./pages/Login";
import Home from "./pages/Home";
import ArtistsGallery from "./pages/ArtistsGallery";
import AdminDashboard from "./components/AdminDashboard";
import TicketPage from "./pages/Tickets";
import DonationPage from "./pages/Donations";
import EventsPage from "./pages/Events";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artists" element={<ArtistsGallery />} />
        <Route path="/tickets" element={<TicketPage />} />
        <Route path="/donations" element={<DonationPage />} />
        <Route path="/events" element={<EventsPage />} />

        {/* Admin Only Routes */}
        <Route
          path="/admin"
          element={
            <AdminDashboard /> // or wrap with ProtectedRoute if needed
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;