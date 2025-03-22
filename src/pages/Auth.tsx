
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  // Pre-fill with requested user credentials
  const [email, setEmail] = useState("user1@example.com");
  const [password, setPassword] = useState("12345");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/chat";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast({
          title: "Успешный вход",
          description: "Вы успешно вошли в систему",
        });
        
        // Navigate to the intended destination or default to /chat
        const from = location.state?.from?.pathname || "/chat";
        navigate(from, { replace: true });
      } else {
        // Registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user?.identities?.length === 0) {
          toast({
            title: "Пользователь уже существует",
            description: "Этот email уже зарегистрирован. Попробуйте войти.",
            variant: "destructive",
          });
          setIsLogin(true);
        } else {
          toast({
            title: "Регистрация выполнена",
            description: "Проверьте почту для подтверждения аккаунта",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      // Try creating the user1 account
      const { data, error } = await supabase.auth.signUp({
        email: "user1@example.com",
        password: "12345",
      });

      if (error) {
        if (error.message.includes("already")) {
          toast({
            title: "Аккаунт готов к использованию",
            description: "Пользователь user1 уже существует и готов к использованию",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Аккаунт создан",
          description: "Пользователь user1 создан успешно. Теперь вы можете войти.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img
              src="/lovable-uploads/83e51342-b821-4bb3-8635-db4b3711fc2f.png"
              alt="ProTalk Logo"
              className="h-12 w-12"
            />
          </div>
          <h2 className="text-2xl font-bold">{isLogin ? "Вход" : "Регистрация"}</h2>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Войдите в свой аккаунт ProTalk"
              : "Создайте новый аккаунт ProTalk"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Загрузка..."
              : isLogin
                ? "Войти"
                : "Зарегистрироваться"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>
        </div>

        <div className="text-center mt-4">
          <Button 
            variant="outline" 
            onClick={handleCreateUser}
            className="w-full"
            disabled={loading}
          >
            Создать пользователя user1
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Email: user1@example.com, Пароль: 12345
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
