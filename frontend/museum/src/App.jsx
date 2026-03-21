import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Artists from "./pages/Artists";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home redirects to artists for now */}
        <Route path="/" element={<Navigate to="/artists" />} />

        {/* Artist page */}
        <Route path="/artists" element={<Artists />} />

        {/* Fallback route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;