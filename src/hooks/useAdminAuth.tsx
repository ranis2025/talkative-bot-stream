
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface AdminAuthState {
  isAuthenticated: boolean;
  adminRole: string | null;
  adminId: string | null;
  authError: string;
}

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    adminRole: null,
    adminId: null,
    authError: ""
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
    
    // Check admin session
    const storedRole = sessionStorage.getItem("admin_role");
    const username = sessionStorage.getItem("admin_username");
    const storedAdminId = sessionStorage.getItem("admin_id");
    
    if (storedRole && username) {
      setAuthState({
        isAuthenticated: true,
        adminRole: storedRole,
        adminId: storedAdminId,
        authError: ""
      });
      
      if (!storedAdminId) {
        console.warn("No admin ID found in session storage");
      } else {
        console.log("Retrieved admin ID from session storage:", storedAdminId);
      }
    }
  }, [token, searchParams, navigate]);

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      // Check admin credentials against the admin_roles table
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("username", username as any)
        .eq("password", password as any)
        .maybeSingle();
      
      if (adminError) throw adminError;
      
      if (!adminUser) {
        setAuthState(prev => ({ ...prev, authError: "Неверное имя пользователя или пароль" }));
        return;
      }
      
      // Type guard to ensure adminUser has the expected properties
      if (adminUser && typeof adminUser === 'object' && 'id' in adminUser && 'role' in adminUser && 'username' in adminUser) {
        const admin = adminUser as any;
        
        console.log("Admin authenticated successfully:", admin);
        console.log("Admin ID:", admin.id);
        
        // Store admin info in session storage
        sessionStorage.setItem("admin_role", admin.role);
        sessionStorage.setItem("admin_username", admin.username);
        sessionStorage.setItem("admin_id", admin.id);
        
        setAuthState({
          isAuthenticated: true,
          adminRole: admin.role,
          adminId: admin.id,
          authError: ""
        });
        
        // Redirect Super Admin to its own page
        if (admin.role === 'super_admin') {
          navigate("/super-admin");
        }
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthState(prev => ({ ...prev, authError: "Ошибка при проверке учетных данных" }));
    }
  };

  const handleAdminLogout = () => {
    setAuthState({
      isAuthenticated: false,
      adminRole: null,
      adminId: null,
      authError: ""
    });
    
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_id");
    
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из панели администратора"
    });
  };

  return {
    ...authState,
    handleAdminLogin,
    handleAdminLogout
  };
};
