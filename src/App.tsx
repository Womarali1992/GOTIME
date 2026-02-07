
import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import CoachLogin from "./pages/CoachLogin";
import CoachDashboard from "./pages/CoachDashboard";
import CoachBooking from "./pages/CoachBooking";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/book-coach" element={<CoachBooking />} />
      <Route
        path="/admin"
        element={
          <ErrorBoundary>
            <Admin />
          </ErrorBoundary>
        }
      />
      <Route path="/coach-login" element={<CoachLogin />} />
      <Route
        path="/coach-dashboard"
        element={
          <ErrorBoundary>
            <CoachDashboard />
          </ErrorBoundary>
        }
      />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
