
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [tokenLoading, setTokenLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  
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

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUsername || !adminPassword) {
      setAdminError("Пожалуйста, заполните все поля");
      return;
    }
    
    setTokenLoading(true);
    
    try {
      // Check admin credentials against the admin_roles table
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("username", adminUsername)
        .eq("password", adminPassword)
        .maybeSingle();
      
      if (adminError) throw adminError;
      
      if (!adminUser) {
        setAdminError("Неверное имя пользователя или пароль");
        setTokenLoading(false);
        return;
      }
      
      // Store admin info in session storage
      sessionStorage.setItem("admin_role", adminUser.role);
      sessionStorage.setItem("admin_username", adminUser.username);
      
      // Redirect based on role
      if (adminUser.role === 'super_admin') {
        toast({
          title: "Успешный вход",
          description: "Вы вошли как Super Admin",
        });
        navigate("/super-admin");
      } else {
        toast({
          title: "Успешный вход",
          description: "Вы вошли как Admin",
        });
        navigate("/token-admin");
      }
      
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive",
      });
    } finally {
      setTokenLoading(false);
    }
  };

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
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">Пользователь</TabsTrigger>
            <TabsTrigger value="admin">Администратор</TabsTrigger>
          </TabsList>
          <TabsContent value="user">
            <CardContent className="pt-6">
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
          </TabsContent>
          <TabsContent value="admin">
            <CardContent className="pt-6">
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Имя пользователя</Label>
                  <Input 
                    id="adminUsername"
                    type="text" 
                    placeholder="Имя администратора"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Пароль</Label>
                  <Input 
                    id="adminPassword"
                    type="password" 
                    placeholder="Пароль администратора"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                {adminError && (
                  <div className="text-destructive text-sm">{adminError}</div>
                )}
                <Button type="submit" className="w-full flex items-center justify-center" disabled={tokenLoading}>
                  {tokenLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  Войти как Администратор
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
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
