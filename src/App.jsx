import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RoleView from "./pages/RoleView.jsx";
import JobDetailPage from "./pages/JobDetailPage.jsx";

function ProtectedRoute({ children }) {
  // TODO: gate via useAuth() — redirect to /login when unauthenticated
  const isAuthed = true;
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* App (protected) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/role/:roleId"
        element={
          <ProtectedRoute>
            <RoleView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/role/:roleId/job/:jobId"
        element={
          <ProtectedRoute>
            <JobDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
