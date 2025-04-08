
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const [tokenLoading, setTokenLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
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
      handleTokenAuth(token);
    }
  }, [searchParams, navigate, toast, setToken]);

  // Handle token-based authentication
  const handleTokenAuth = async (token: string) => {
    setTokenLoading(true);
    try {
      // Check if token exists in the database
      const { data: tokenExists, error: tokenError } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", token)
        .maybeSingle();
      
      if (!tokenExists && !token.startsWith("demo-")) {
        toast({
          title: "Неверный токен",
          description: "Токен не найден в базе данных",
          variant: "destructive",
        });
        setTokenLoading(false);
        return;
      }
      
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
    } finally {
      setTokenLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!login || !password) {
      setLoginError("Пожалуйста, заполните все поля");
      return;
    }
    
    setTokenLoading(true);
    
    try {
      // Generate token from login and password
      // Use first 8 chars of password or full password if shorter
      const passwordPart = password.length > 8 ? password.substring(0, 8) : password;
      const generatedToken = `${login.toUpperCase()}:${passwordPart}`;
      
      // Check if token already exists
      const { data: existingToken, error: tokenCheckError } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", generatedToken)
        .maybeSingle();
      
      if (!existingToken) {
        // Create new token in database
        const { error: createTokenError } = await supabase
          .from("access_tokens")
          .insert({ 
            token: generatedToken,
            name: login,
            description: `Token for ${login}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (createTokenError) throw createTokenError;
      }
      
      // Authenticate with the generated token
      handleTokenAuth(generatedToken);
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive",
      });
      setTokenLoading(false);
    }
  };

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img
              src="/lovable-uploads/bf49cbb2-32bd-471b-9256-7db1562592e2.png"
              alt={`${appName} Logo`}
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-center">{appName} Чат</CardTitle>
          <CardDescription className="text-center">
            Пожалуйста, введите логин и пароль для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input 
                id="login"
                type="text" 
                placeholder="Введите ваш логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Введите ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && (
              <div className="text-destructive text-sm">{loginError}</div>
            )}
            <Button type="submit" className="w-full flex items-center justify-center" disabled={tokenLoading}>
              {tokenLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Войти
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Войдите, чтобы получить доступ к чату
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
