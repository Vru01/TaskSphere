import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SlideAuth from "./pages/Slideauth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Root path should go to auth */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* All auth routes without navbar */}
        <Route path="/auth/*" element={<WithoutNavbar />} />
        
        {/* All protected routes with navbar */}
        <Route path="/*" element={<WithNavbar />} />
      </Routes>
    </Router>
  );
}

// Component with navbar for protected routes
function WithNavbar() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

// Component without navbar for auth pages
function WithoutNavbar() {
  return (
    <Routes>
      <Route path="/" element={<SlideAuth />} />
      <Route path="/login" element={<SlideAuth initialMode="login" />} />
      <Route path="/signup" element={<SlideAuth initialMode="signup" />} />
      
      {/* Redirect any unknown auth routes to main auth */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}