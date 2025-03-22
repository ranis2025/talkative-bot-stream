
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Check for token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleTokenAuth(token);
    }
  }, [searchParams]);

  // Handle token-based authentication
  const handleTokenAuth = async (token: string) => {
    setTokenLoading(true);
    try {
      // Check if the token exists in the database
      const { data: userData, error: userError } = await supabase
        .from("user_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (userError || !userData) {
        throw new Error("Неверный токен или срок его действия истек");
      }

      // Get the user's email using their ID
      const { data: userDetails, error: detailsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userData.user_id)
        .single();

      if (detailsError || !userDetails?.email) {
        throw new Error("Не удалось найти данные пользователя");
      }

      // Sign in the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userDetails.email,
        password: token, // Using token as password for this auth method
      });

      if (error) throw error;
      
      toast({
        title: "Успешный вход по токену",
        description: "Вы успешно вошли в систему",
      });
      navigate("/chat");
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
        navigate("/chat");
      } else {
        // Registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        toast({
          title: "Регистрация выполнена",
          description: "Проверьте почту для подтверждения аккаунта",
        });
        setIsLogin(true);
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
          <Link to="/" className="text-muted-foreground hover:text-primary">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
