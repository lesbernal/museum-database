// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";  // Add this import
import "./styles/theme.css"; 
import "./App.css";

import Login from "./pages/Login";
import Home from "./pages/Home";
import ArtistsGallery from "./pages/ArtistsGallery";
import GiftShopPage from "./pages/GiftShopPage";
import GiftShopCartPage from "./pages/GiftShopCartPage";
import GiftShopCheckoutPage from "./pages/GiftShopCheckoutPage";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />  {/* Add Navbar here - it will show on all pages */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artists" element={<ArtistsGallery />} />
        <Route path="/gift-shop" element={<GiftShopPage />} />
        <Route path="/gift-shop/cart" element={<GiftShopCartPage />} />
        <Route path="/gift-shop/checkout" element={<GiftShopCheckoutPage />} />
        
        {/* Admin Only Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
