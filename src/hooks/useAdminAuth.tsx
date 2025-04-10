
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
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();
      
      if (adminError) throw adminError;
      
      if (!adminUser) {
        setAuthState(prev => ({ ...prev, authError: "Неверное имя пользователя или пароль" }));
        return;
      }
      
      // Store admin info in session storage
      sessionStorage.setItem("admin_role", adminUser.role);
      sessionStorage.setItem("admin_username", adminUser.username);
      sessionStorage.setItem("admin_id", adminUser.id);
      
      console.log("Admin logged in successfully with ID:", adminUser.id);
      
      setAuthState({
        isAuthenticated: true,
        adminRole: adminUser.role,
        adminId: adminUser.id,
        authError: ""
      });
      
      // Redirect Super Admin to its own page
      if (adminUser.role === 'super_admin') {
        navigate("/super-admin");
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
