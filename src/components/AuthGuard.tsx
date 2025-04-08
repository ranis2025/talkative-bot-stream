
import { ReactNode } from "react";
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
  
  // Extract application name from token if it follows the format "AppName:User"
  const getAppName = () => {
    if (!token) return "BIZO";
    
    // Check if token follows the expected format
    const tokenParts = token.split(':');
    if (tokenParts.length === 2) {
      return tokenParts[0]; // Return the app name part
    }
    
    return "BIZO"; // Default fallback
  };
  
  const appName = getAppName();
  
  // Check if there's a token in the URL
  const urlToken = searchParams.get("token");
  
  // If we have a token in the URL but not in context, set it
  if (urlToken && urlToken !== token) {
    console.log("Setting token from URL:", urlToken);
    setToken(urlToken);
    return <>{children}</>;
  }
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка...</span>
      </div>
    );
  }

  // If no token is provided at all, redirect to auth page with demo token
  if (!token && !urlToken) {
    return <Navigate to="/auth?token=demo-token" state={{ from: location }} replace />;
  }

  // Allow access to protected route
  return <>{children}</>;
};
