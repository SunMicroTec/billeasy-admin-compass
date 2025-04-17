
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddSchool from "./pages/AddSchool";
import SchoolDetails from "./pages/SchoolDetails";
import ActivityLogs from "./pages/ActivityLogs";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const user = localStorage.getItem("billeasy-user");
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  // Function to be passed to Login component for auth state management
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Function to be passed to Layout component for handling logout
  const handleLogout = () => {
    localStorage.removeItem("billeasy-user");
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Layout onLogout={handleLogout}>
                      <Dashboard />
                    </Layout>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/add-school"
                element={
                  isAuthenticated ? (
                    <Layout onLogout={handleLogout}>
                      <AddSchool />
                    </Layout>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/school/:id"
                element={
                  isAuthenticated ? (
                    <Layout onLogout={handleLogout}>
                      <SchoolDetails />
                    </Layout>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/logs"
                element={
                  isAuthenticated ? (
                    <Layout onLogout={handleLogout}>
                      <ActivityLogs />
                    </Layout>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
