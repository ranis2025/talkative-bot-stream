
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
    if (!tokenValue) return "BIZO";
    
    // Check if token follows the expected format
    const tokenParts = tokenValue.split(':');
    if (tokenParts.length === 2) {
      return tokenParts[0]; // Return the app name part
    }
    
    return "BIZO"; // Default fallback
  };
  
  // Check for token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleTokenAuth(token);
    } else {
      // If no token, show error and redirect to chat with a demo token
      toast({
        title: "Требуется токен",
        description: "Для доступа к приложению необходим токен в URL",
        variant: "destructive",
      });
      // Redirect to chat with a demo token
      navigate("/chat?token=demo-token");
    }
  }, [searchParams, navigate, toast, setToken]);

  // Handle token-based authentication
  const handleTokenAuth = async (token: string) => {
    setTokenLoading(true);
    try {
      // Create or get user settings for this token
      const { data: existingSettings, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      
      if (!existingSettings) {
        // If no settings found for this token, create new settings
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
      
      // Set token in context
      setToken(token);
      
      // Navigate to chat page with token
      toast({
        title: "Успешный вход по токену",
        description: "Вы успешно вошли в систему",
      });
      navigate(`/chat?token=${token}`);
    } catch (error: any) {
      toast({
        title: "Ошибка аутентификации по токену",
        description: error.message || "Произошла ошибка при входе по токену",
        variant: "destructive",
      });
      // Redirect to chat with a demo token on error
      navigate("/chat?token=demo-token");
    } finally {
      setTokenLoading(false);
    }
  };

  const appName = getAppName(searchParams.get("token"));

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">Выполняется вход по токену...</span>
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
            Для доступа к приложению необходим токен в URL
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
