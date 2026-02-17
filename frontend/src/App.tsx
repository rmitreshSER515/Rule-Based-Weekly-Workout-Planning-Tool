import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import FitnessTrackerPage from "./components/FitnessTrackerPage";
import RegisterPage from "./components/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/fitness" element={<FitnessTrackerPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}