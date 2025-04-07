
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [tokenLoading, setTokenLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { token, isLoading } = useAuth();
  
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
  
  // Redirect to chat if already authenticated
  useEffect(() => {
    if (token && !isLoading) {
      navigate(`/chat?token=${token}`);
    }
  }, [token, isLoading, navigate]);
  
  // Check for token in URL
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setTokenLoading(true);
      // Если токен уже установлен через AuthProvider, переадресуем пользователя
      setTimeout(() => {
        setTokenLoading(false);
        if (token) {
          navigate(`/chat?token=${token}`);
        }
      }, 500);
    }
  }, [searchParams, navigate, token]);

  const appName = getAppName(searchParams.get("token") || token);

  if (isLoading || tokenLoading) {
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
            Войдите в свой аккаунт или создайте новый
          </p>
        </div>
        
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Войдите, используя свои учетные данные</p>
            </div>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <RegisterForm />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Создайте новый аккаунт с доступом к ботам</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 text-center text-xs border-t border-border text-muted-foreground">
          <p>Также можно использовать прямой доступ по токену через URL</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
