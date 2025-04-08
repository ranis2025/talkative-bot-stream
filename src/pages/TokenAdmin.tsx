
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  TokenRecord, 
  AssignedBot, 
  getTokens, 
  getAssignedBots
} from "@/lib/tokenAdmin";
import { TooltipProvider } from "@/components/ui/tooltip";
import TokenList from "@/components/token-admin/TokenList";
import BotAssignmentList from "@/components/token-admin/BotAssignmentList";
import AdminLoginForm from "@/components/token-admin/AdminLoginForm";

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  const handleAdminLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      setAuthError("");
      localStorage.setItem("token_admin_auth", "true");
    } else {
      setAuthError("Неверное имя пользователя или пароль");
    }
  };

  useEffect(() => {
    const isAdminAuth = localStorage.getItem("token_admin_auth") === "true";
    if (isAdminAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token_admin_auth");
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchTokens();
      fetchAssignedBots();
    }
  }, [token, isAuthenticated, refreshData]);

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      
      const data = await getTokens();
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные токенов",
        variant: "destructive"
      });
      
      setTokens([
        {
          id: '1',
          token: 'AppName:User123',
          name: 'Test App',
          description: 'Test description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchAssignedBots = async () => {
    try {
      setLoadingAssignments(true);
      const data = await getAssignedBots();
      setAssignedBots(data);
    } catch (error) {
      console.error("Error fetching token-bot assignments:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные назначений",
        variant: "destructive"
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const refreshAllData = () => {
    setRefreshData(prev => prev + 1);
  };

  const handleBackToChat = () => {
    navigate(token ? `/chat?token=${token}` : '/chat');
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginForm 
        onLogin={handleAdminLogin} 
        onBackToChat={handleBackToChat} 
        authError={authError} 
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Управление Magic токенами</h1>
          <div className="flex gap-2">
            <Button onClick={refreshAllData} variant="outline">
              Обновить данные
            </Button>
            <Button onClick={handleAdminLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Выйти из админ-панели
            </Button>
            <Button onClick={handleBackToChat} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Вернуться к чату
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Magic токены</CardTitle>
              <CardDescription>Управление Magic токенами для доступа к API</CardDescription>
            </CardHeader>
            <CardContent>
              <TokenList 
                tokens={tokens} 
                setTokens={setTokens} 
                loadingTokens={loadingTokens} 
                fetchTokens={fetchTokens} 
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Назначение ботов токенам</CardTitle>
              <CardDescription>Управление связями между Magic токенами и ботами</CardDescription>
            </CardHeader>
            <CardContent>
              <BotAssignmentList 
                tokens={tokens}
                assignedBots={assignedBots}
                loadingAssignments={loadingAssignments}
                fetchAssignedBots={fetchAssignedBots}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TokenAdmin;
