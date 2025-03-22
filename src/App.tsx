
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Handle route with token parameter
const RouteWithToken = ({ element }: { element: React.ReactNode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");

  // If token exists, we want to preserve it in the URL when navigating
  if (token) {
    // Just return the element with the preserved token in the URL
    return <>{element}</>;
  }

  return <>{element}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route 
                path="/auth" 
                element={<Auth />}
              />
              <Route 
                path="/chat" 
                element={
                  <RouteWithToken element={
                    <AuthGuard>
                      <Index />
                    </AuthGuard>
                  } />
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <RouteWithToken element={
                    <AuthGuard>
                      <Admin />
                    </AuthGuard>
                  } />
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
