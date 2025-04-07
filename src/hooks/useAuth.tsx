
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    
    // Try to get token from local storage if not in URL
    const storedToken = localStorage.getItem("auth_token");
    
    if (urlToken) {
      checkOrCreateUserSettings(urlToken);
      setToken(urlToken);
      localStorage.setItem("auth_token", urlToken);
      console.log("Token set from URL:", urlToken);
    } else if (storedToken) {
      checkOrCreateUserSettings(storedToken);
      setToken(storedToken);
      console.log("Token restored from storage:", storedToken);
    } else {
      toast({
        title: "Требуется токен",
        description: "Для доступа к приложению необходим токен в URL",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  }, [searchParams, toast]);

  const checkOrCreateUserSettings = async (token: string) => {
    try {
      const { data: existingSettings, error: checkError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      
      if (!existingSettings && checkError?.code === "PGRST116") {
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
        
        if (createError) {
          console.error("Error creating user settings:", createError);
        }
      }
    } catch (error) {
      console.error("Error checking or creating user settings:", error);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("auth_token");
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из системы",
    });
    navigate("/auth");
  };

  const value = {
    token,
    isLoading,
    setToken,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
