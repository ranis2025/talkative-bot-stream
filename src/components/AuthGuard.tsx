
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
  const { token, isLoading, setToken, validateToken } = useAuth();
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
  
  // Check if there's a token in the URL that needs to be set in context
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken && urlToken !== token) {
      console.log("Setting token from URL:", urlToken);
      
      // Validate the token before setting it
      validateToken(urlToken).then(isValid => {
        if (isValid) {
          setToken(urlToken);
        } else if (location.pathname !== "/auth") {
          // If token is invalid, redirect to auth page
          navigate("/auth");
        }
      });
    } else if (token && !searchParams.get("token") && 
               (location.pathname === "/chat" || location.pathname === "/group-chats" || 
                location.pathname === "/admin" || location.pathname === "/token-admin" || 
                location.pathname === "/db-admin")) {
      // If we have a token in context but not in URL, add it to the URL for protected routes
      console.log("Adding token to URL:", token);
      navigate(`${location.pathname}?token=${token}`, { replace: true });
    }
  }, [searchParams, token, setToken, location, navigate, validateToken]);
  
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
