import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import { UserProvider, useUser } from "./contexts/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useUser();
  const location = useLocation(); // Get current location

  // 1. If still checking auth state, render nothing (or a loading spinner)
  if (isLoading) {
    // Optionally return a loading component: return <LoadingSpinner />;
    return null;
  }

  // 2. If done loading and user is not logged in, redirect to login
  if (!isLoggedIn) {
    // Pass the current location state so user can be redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If done loading and user is logged in, render the requested child component
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn } = useUser();
  
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/" /> : <Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/tasks" element={
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      } />
      
      <Route path="/calendar" element={
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      } />
      
      <Route path="/team" element={
        <ProtectedRoute>
          <Team />
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
