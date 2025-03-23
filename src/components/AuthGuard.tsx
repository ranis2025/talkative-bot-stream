
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const location = useLocation();
  const { token, isLoading } = useAuth();
  const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
  
  // Still loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка...</span>
      </div>
    );
  }

  // If admin, bypass token requirement
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // If no token and not admin, redirect to auth page
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If there's a token, allow access
  return <>{children}</>;
};
