
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if the URL has a token parameter
  const hasTokenParam = searchParams.has("token");

  // If there's a token in the URL but user isn't loaded yet, always show loading
  if (hasTokenParam && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Авторизация по токену...</span>
      </div>
    );
  }

  // Regular loading state for normal auth flow
  if (isLoading && !hasTokenParam) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка...</span>
      </div>
    );
  }

  // If user is not authenticated and there's no token, redirect to auth
  if (!user && !hasTokenParam) {
    // Redirect to auth page and save the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is not authenticated but there is a token, redirect to auth with the token
  if (!user && hasTokenParam) {
    const token = searchParams.get("token");
    return <Navigate to={`/auth?token=${token}`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
