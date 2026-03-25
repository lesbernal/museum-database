// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";  // optional for now
import "./App.css";

import Login from "./pages/Login";
import Home from "./pages/Home";
import ArtistsGallery from "./pages/ArtistsGallery";
import AdminDashboard from "./components/AdminDashboard";
import TicketPage from "./pages/Tickets";      // match filename exactly
import DonationPage from "./pages/Donations";  // match filename exactly
import EventsPage from "./pages/Events";      // match filename exactly

function App() {
  return (
    <BrowserRouter>
      {/* Navbar can be added later */}
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