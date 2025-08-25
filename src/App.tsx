
import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/admin"
        element={
          <ErrorBoundary>
            <Admin />
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
