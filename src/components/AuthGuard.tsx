
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the URL has a token parameter
  const token = searchParams.get("token");

  useEffect(() => {
    // Simple timeout to simulate token validation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [token]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Проверка токена...</span>
      </div>
    );
  }

  // If no token is provided, redirect to auth page
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Token exists, allow access to protected route
  return <>{children}</>;
};
