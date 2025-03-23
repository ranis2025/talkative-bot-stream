
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isLoading, setToken } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Check if there's a token in the URL that needs to be set in context
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken && urlToken !== token) {
      setToken(urlToken);
    } else if (token && !searchParams.get("token") && location.pathname !== "/auth") {
      // If we have a token in context but not in URL, add it to the URL
      navigate(`${location.pathname}?token=${token}`, { replace: true });
    }
  }, [searchParams, token, setToken, location, navigate]);
  
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
