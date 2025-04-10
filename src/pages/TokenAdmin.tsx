
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
import { supabase } from "@/integrations/supabase/client";

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
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
    
    // Check admin session
    const storedRole = sessionStorage.getItem("admin_role");
    const username = sessionStorage.getItem("admin_username");
    const storedAdminId = sessionStorage.getItem("admin_id");
    
    if (storedRole && username) {
      setIsAuthenticated(true);
      setAdminRole(storedRole);
      if (storedAdminId) {
        console.log("Retrieved admin ID from session storage:", storedAdminId);
        setAdminId(storedAdminId);
      } else {
        console.warn("No admin ID found in session storage");
      }
    }
  }, [token, searchParams, navigate]);

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      // Check admin credentials against the admin_roles table
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();
      
      if (adminError) throw adminError;
      
      if (!adminUser) {
        setAuthError("Неверное имя пользователя или пароль");
        return;
      }
      
      // Store admin info in session storage
      sessionStorage.setItem("admin_role", adminUser.role);
      sessionStorage.setItem("admin_username", adminUser.username);
      sessionStorage.setItem("admin_id", adminUser.id);
      
      console.log("Admin logged in successfully with ID:", adminUser.id);
      
      setIsAuthenticated(true);
      setAdminRole(adminUser.role);
      setAdminId(adminUser.id);
      setAuthError("");
      
      // Redirect Super Admin to its own page
      if (adminUser.role === 'super_admin') {
        navigate("/super-admin");
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError("Ошибка при проверке учетных данных");
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setAdminRole(null);
    setAdminId(null);
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_id");
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из панели администратора"
    });
  };

  const handleSuperAdminRedirect = () => {
    navigate("/auth");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTokens();
      fetchAssignedBots();
    }
  }, [isAuthenticated, refreshData]);

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
          admin_id: null
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
        onSuperAdminRedirect={handleSuperAdminRedirect}
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
                adminId={adminId}
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
