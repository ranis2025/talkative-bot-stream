
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";
import GroupChats from "./pages/GroupChats";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route 
                path="/auth" 
                element={<Auth />}
              />
              <Route 
                path="/admin-auth" 
                element={<AdminAuth />}
              />
              <Route 
                path="/chat" 
                element={
                  <AuthGuard>
                    <Index />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/group-chats" 
                element={
                  <AuthGuard>
                    <GroupChats />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminAuthGuard>
                    <Admin />
                  </AdminAuthGuard>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
