
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
  validateToken: (token: string) => Promise<boolean>;
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
      validateAndSetToken(urlToken);
    } else if (storedToken) {
      validateAndSetToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [searchParams, toast]);

  const clearAllStorageData = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("All local and session storage data cleared");
  };

  const validateAndSetToken = async (token: string) => {
    // Clear all existing storage data first to prevent conflicts
    clearAllStorageData();
    
    if (token.startsWith("demo-")) {
      // Demo tokens are always valid
      checkOrCreateUserSettings(token);
      setToken(token);
      localStorage.setItem("auth_token", token);
      setIsLoading(false);
      return;
    }
    
    try {
      // Check if token exists in the database
      const { data: tokenExists, error: tokenError } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", token)
        .maybeSingle();
      
      if (tokenExists) {
        // Token is valid
        await checkOrCreateUserSettings(token);
        setToken(token);
        localStorage.setItem("auth_token", token);
        console.log("Token validated and set:", token);
      } else {
        // Token not found, redirect to auth page
        console.log("Invalid token, redirecting to auth page");
        if (window.location.pathname !== "/auth") {
          navigate("/auth");
        }
        setToken(null);
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      // On error, we'll allow the token for now and let the API calls fail if needed
      await checkOrCreateUserSettings(token);
      setToken(token);
      localStorage.setItem("auth_token", token);
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    if (token.startsWith("demo-")) {
      return true;
    }
    
    try {
      const { data, error } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", token)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  };

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
    // Clear everything from storage when logging out
    clearAllStorageData();
    setToken(null);
    
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
    logout,
    validateToken
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
