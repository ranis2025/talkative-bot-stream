
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminAuthGuardProps {
  children: ReactNode;
}

export const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = localStorage.getItem("adminAuthenticated");
    setIsAdminAuthenticated(adminAuth === "true");
  }, []);
  
  // If still checking admin authentication, show loading
  if (isAdminAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Проверка доступа администратора...</span>
      </div>
    );
  }

  // Not admin authenticated, redirect to admin login
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin-auth" state={{ from: location }} replace />;
  }

  // Admin is authenticated, bypass token requirement
  // Allow access to admin functionality without token
  return <>{children}</>;
}
