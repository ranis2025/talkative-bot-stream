
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";

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
