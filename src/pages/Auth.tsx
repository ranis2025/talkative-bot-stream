
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

const Auth = () => {
  const [tokenLoading, setTokenLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  
  // Extract application name from token if it follows the format "AppName:User"
  const getAppName = (tokenValue: string | null) => {
    if (!tokenValue) return "ProTalk";
    
    // Check if token follows the expected format
    const tokenParts = tokenValue.split(':');
    if (tokenParts.length === 2) {
      return tokenParts[0]; // Return the app name part
    }
    
    return "ProTalk"; // Default fallback
  };
  
  // Check for token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Skip validation and directly use the token
      setTokenLoading(true);
      
      // Set token in context
      setToken(token);
      
      // Redirect to chat
      navigate(`/chat?token=${token}`, { replace: true });
      setTokenLoading(false);
    } else {
      // If no token, redirect to chat with a demo token
      toast({
        title: "Демо режим",
        description: "Используется демо токен для доступа к приложению",
      });
      navigate("/chat?token=demo-token", { replace: true });
    }
  }, [searchParams, navigate, toast, setToken]);

  const appName = getAppName(searchParams.get("token"));

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">Выполняется вход...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img
              src="/lovable-uploads/bf49cbb2-32bd-471b-9256-7db1562592e2.png"
              alt={`${appName} Logo`}
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold">Вход в {appName} Чат</h2>
          <p className="text-muted-foreground mt-2">
            Выполняется вход...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
