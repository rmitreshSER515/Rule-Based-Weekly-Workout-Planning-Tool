import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import FitnessTrackerPage from "./components/FitnessTrackerPage";
import SchedulePage from "./components/SchedulePage";
import CompareSchedulesPage from "./components/CompareSchedulesPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/Forgotpasswordpage";

const token = () => localStorage.getItem("token");

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return token() ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  return !token() ? <>{children}</> : <Navigate to="/fitness" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

      <Route path="/fitness" element={<ProtectedRoute><FitnessTrackerPage /></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><CompareSchedulesPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}