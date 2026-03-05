import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ThankYouPage from "./pages/ThankYouPage";

import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      {/* FE */}
      <Route path="/" element={<HomePage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* BE */}
      <Route path="/be" element={<AdminDashboard />} />
    </Routes>
  );
}