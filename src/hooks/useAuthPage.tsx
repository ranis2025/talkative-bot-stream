
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

export const useAuthPage = () => {
  const [tokenLoading, setTokenLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [rootError, setRootError] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleTokenAuth(token);
    }
  }, [searchParams]);

  const clearAllSessionData = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("All session data cleared during authentication");
  };

  const setupUserSettings = async (token: string) => {
    try {
      const { data: existingSettings, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token as any)
        .maybeSingle();

      if (!existingSettings) {
        const userId = uuidv4();
        const { error: createError } = await supabase
          .from("user_settings")
          .insert({
            token: token,
            theme: 'dark',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId
          } as any);
        
        if (createError) throw createError;
      }
    } catch (error) {
      console.error("Error setting up user settings:", error);
      throw error;
    }
  };

  const handleTokenAuth = async (token: string) => {
    setTokenLoading(true);
    try {
      clearAllSessionData();
      const { data: tokenExists, error: tokenError } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", token as any)
        .maybeSingle();

      if (!tokenExists && !token.startsWith("demo-")) {
        toast({
          title: "Неверный токен",
          description: "Токен не найден в базе данных",
          variant: "destructive"
        });
        setTokenLoading(false);
        return;
      }

      await setupUserSettings(token);

      setToken(token);
      toast({
        title: "Успешный вход по токену",
        description: "Вы успешно вошли в систему"
      });
      navigate(`/chat?token=${token}`);
    } catch (error: any) {
      toast({
        title: "Ошибка аутентификации по токену",
        description: error.message || "Произошла ошибка при входе по токену",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const handleLoginSubmit = async (login: string, password: string) => {
    if (!login || !password) {
      setLoginError("Пожалуйста, заполните все поля");
      return;
    }

    setTokenLoading(true);
    try {
      clearAllSessionData();
      const passwordPart = password.length > 8 ? password.substring(0, 8) : password;
      const generatedToken = `${login}:${passwordPart}`; // Changed from login.toUpperCase()
      
      const { data: existingToken, error: tokenCheckError } = await supabase
        .from("access_tokens")
        .select("id, token")
        .eq("token", generatedToken as any)
        .maybeSingle();

      if (!existingToken) {
        const { data: newToken, error: createTokenError } = await supabase
          .from("access_tokens")
          .insert({
            token: generatedToken,
            name: login,
            description: `Token for ${login}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .select('id, token')
          .single();

        if (createTokenError) throw createTokenError;
        
        await setupUserSettings(generatedToken);
        setToken(generatedToken);
        toast({
          title: "Успешный вход",
          description: "Вы успешно вошли в систему"
        });
        navigate(`/chat?token=${generatedToken}`);
      } else {
        const tokenValue = existingToken && typeof existingToken === 'object' && 'token' in existingToken 
          ? (existingToken as any).token 
          : generatedToken;
        
        await setupUserSettings(tokenValue);
        setToken(tokenValue);
        toast({
          title: "Успешный вход",
          description: "Вы успешно вошли в систему"
        });
        navigate(`/chat?token=${tokenValue}`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const handleAdminLogin = async (username: string, password: string) => {
    if (!username || !password) {
      setAdminError("Пожалуйста, заполните все поля");
      return;
    }
    setTokenLoading(true);
    try {
      clearAllSessionData();
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("username", username as any)
        .eq("password", password as any)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminUser) {
        setAdminError("Неверное имя пользователя или пароль");
        setTokenLoading(false);
        return;
      }

      // Type guard for adminUser
      if (adminUser && typeof adminUser === 'object' && 'role' in adminUser && 'username' in adminUser && 'id' in adminUser) {
        const admin = adminUser as any;
        
        sessionStorage.setItem("admin_role", admin.role);
        sessionStorage.setItem("admin_username", admin.username);
        sessionStorage.setItem("admin_id", admin.id);

        if (admin.role === 'super_admin') {
          toast({
            title: "Успешный вход",
            description: "Вы вошли как Super Admin"
          });
          navigate("/super-admin");
        } else {
          toast({
            title: "Успешный вход",
            description: "Вы вошли как Admin"
          });
          navigate("/token-admin");
        }
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRootLogin = async (username: string, password: string) => {
    if (!username || !password) {
      setRootError("Пожалуйста, заполните все поля");
      return;
    }
    setTokenLoading(true);
    try {
      clearAllSessionData();
      const { data: superAdmin, error: superAdminError } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("username", username as any)
        .eq("password", password as any)
        .eq("role", "super_admin" as any)
        .maybeSingle();

      if (superAdminError) throw superAdminError;
      if (!superAdmin) {
        setRootError("Неверное имя пользователя или пароль");
        setTokenLoading(false);
        return;
      }

      // Type guard for superAdmin
      if (superAdmin && typeof superAdmin === 'object' && 'role' in superAdmin && 'username' in superAdmin && 'id' in superAdmin) {
        const admin = superAdmin as any;
        
        sessionStorage.setItem("admin_role", admin.role);
        sessionStorage.setItem("admin_username", admin.username);
        sessionStorage.setItem("admin_id", admin.id);
        
        toast({
          title: "Успешный вход",
          description: "Вы вошли как Super Admin"
        });
        navigate("/super-admin");
      }
    } catch (error: any) {
      console.error("Root login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
  };

  return {
    tokenLoading,
    loginError,
    adminError,
    rootError,
    handleLoginSubmit,
    handleAdminLogin,
    handleRootLogin
  };
};
