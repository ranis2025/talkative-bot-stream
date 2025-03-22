
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Get token from URL
    const urlToken = searchParams.get("token");
    
    if (urlToken) {
      // Check if user settings exist for this token
      checkOrCreateUserSettings(urlToken);
      setToken(urlToken);
    } else {
      toast({
        title: "Требуется токен",
        description: "Для доступа к приложению необходим токен в URL",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  }, [searchParams, toast]);

  // Check if user settings exist for this token or create them
  const checkOrCreateUserSettings = async (token: string) => {
    try {
      // Check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      
      // If no settings found, create new settings
      if (!existingSettings && checkError?.code === "PGRST116") {
        const { error: createError } = await supabase
          .from("user_settings")
          .insert({ 
            token: token,
            theme: 'dark',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error("Error creating user settings:", createError);
        }
      }
    } catch (error) {
      console.error("Error checking or creating user settings:", error);
    }
  };

  // Provide the context value
  const value = {
    token,
    isLoading,
    setToken
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
