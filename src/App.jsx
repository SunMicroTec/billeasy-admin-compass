
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
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 5 * 1000, // 5 seconds
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage and from Supabase session
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Check localStorage first for immediate UI response
      const user = localStorage.getItem("billeasy-user");
      if (user) {
        setIsAuthenticated(true);
      }

      // Then verify with Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        localStorage.setItem("billeasy-user", JSON.stringify(session.user));
      } else if (!user) {
        setIsAuthenticated(false);
        localStorage.removeItem("billeasy-user");
      }
      
      setIsLoading(false);
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        localStorage.setItem("billeasy-user", JSON.stringify(session.user));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.removeItem("billeasy-user");
      }
    });

    checkAuth();

    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Function to be passed to Login component for auth state management
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    localStorage.setItem("billeasy-user", JSON.stringify(userData));
  };

  // Function to be passed to Layout component for handling logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("billeasy-user");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
