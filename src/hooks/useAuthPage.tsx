
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
        .eq("token", token)
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
          });
        
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
        .eq("token", token)
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
      const generatedToken = `${login.toUpperCase()}:${passwordPart}`;
      
      const { data: existingToken, error: tokenCheckError } = await supabase
        .from("access_tokens")
        .select("id, token")
        .eq("token", generatedToken)
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
          })
          .select('id, token')
          .single();

        if (createTokenError) throw createTokenError;
        
        await handleTokenAuth(generatedToken);
      } else {
        await handleTokenAuth(existingToken.token);
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
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminUser) {
        setAdminError("Неверное имя пользователя или пароль");
        setTokenLoading(false);
        return;
      }

      sessionStorage.setItem("admin_role", adminUser.role);
      sessionStorage.setItem("admin_username", adminUser.username);
      sessionStorage.setItem("admin_id", adminUser.id);

      if (adminUser.role === 'super_admin') {
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
        .eq("username", username)
        .eq("password", password)
        .eq("role", "super_admin")
        .maybeSingle();

      if (superAdminError) throw superAdminError;
      if (!superAdmin) {
        setRootError("Неверное имя пользователя или пароль");
        setTokenLoading(false);
        return;
      }

      sessionStorage.setItem("admin_role", superAdmin.role);
      sessionStorage.setItem("admin_username", superAdmin.username);
      sessionStorage.setItem("admin_id", superAdmin.id);
      
      toast({
        title: "Успешный вход",
        description: "Вы вошли как Super Admin"
      });
      navigate("/super-admin");
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
