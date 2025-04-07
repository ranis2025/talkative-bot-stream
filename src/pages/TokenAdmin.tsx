
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Plus, Trash2, ArrowLeft, Copy, Key, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { 
  TokenRecord, 
  AssignedBot, 
  getTokens, 
  getAssignedBots, 
  addToken, 
  updateToken, 
  deleteToken, 
  assignBotToToken, 
  removeAssignment 
} from "@/lib/tokenAdmin";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [newAssignment, setNewAssignment] = useState({ token_id: "", bot_id: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure token is preserved in URL
  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  // Admin login handler
  const handleAdminLogin = () => {
    setIsSubmitting(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        setIsAuthenticated(true);
        setAuthError("");
        localStorage.setItem("token_admin_auth", "true");
        toast({
          title: "Успешный вход",
          description: "Вы вошли в панель управления токенами",
        });
      } else {
        setAuthError("Неверное имя пользователя или пароль");
        toast({
          title: "Ошибка входа",
          description: "Неверное имя пользователя или пароль",
          variant: "destructive"
        });
      }
      setIsSubmitting(false);
    }, 600);
  };

  // Check for existing admin authentication
  useEffect(() => {
    const isAdminAuth = localStorage.getItem("token_admin_auth") === "true";
    if (isAdminAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Admin logout handler
  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token_admin_auth");
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из панели управления токенами",
    });
  };

  // Fetch tokens and bots data
  useEffect(() => {
    if (token && isAuthenticated) {
      fetchTokens();
      fetchAssignedBots();
    }
  }, [token, isAuthenticated]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      
      // Use our utility function instead of direct Supabase calls
      const data = await getTokens();
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные токенов",
        variant: "destructive"
      });
      
      // Use mock data as fallback
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
      setLoading(false);
    }
  };

  const fetchAssignedBots = async () => {
    try {
      // Use our utility function instead of direct Supabase calls
      const data = await getAssignedBots();
      setAssignedBots(data);
    } catch (error) {
      console.error("Error fetching token-bot assignments:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные назначений",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewToken(prev => ({ ...prev, [name]: value }));
  };

  const handleTokenChange = (index: number, field: string, value: string) => {
    const updatedTokens = [...tokens];
    updatedTokens[index] = { ...updatedTokens[index], [field]: value };
    setTokens(updatedTokens);
  };

  const saveToken = async (tokenRecord: TokenRecord) => {
    try {
      setIsSubmitting(true);
      // Use our utility function instead of direct Supabase calls
      await updateToken(tokenRecord.id, tokenRecord.name, tokenRecord.description);
      
      toast({
        title: "Успешно",
        description: "Токен обновлен",
      });
      
      fetchTokens();
    } catch (error) {
      console.error("Error updating token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить токен",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateToken = (name?: string) => {
    // Generate a token in format AppName:UserID
    const appName = name?.replace(/\s+/g, '') || 'App';
    const userId = uuidv4().slice(0, 8);
    return `${appName}:${userId}`;
  };

  const addNewToken = async () => {
    if (!newToken.name) {
      toast({
        title: "Ошибка",
        description: "Название токена обязательно",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const tokenValue = generateToken(newToken.name);
      
      // Use our utility function instead of direct Supabase calls
      await addToken(tokenValue, newToken.name, newToken.description);
      
      toast({
        title: "Успешно",
        description: "Новый токен добавлен",
      });
      
      setNewToken({ name: "", description: "" });
      fetchTokens();
    } catch (error) {
      console.error("Error adding token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить токен",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTokenHandler = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот токен?")) return;
    
    try {
      setIsSubmitting(true);
      // Use our utility function instead of direct Supabase calls
      await deleteToken(id);
      
      toast({
        title: "Успешно",
        description: "Токен удален",
      });
      
      fetchTokens();
      fetchAssignedBots(); // Refresh assignments as they might have been deleted by cascade
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить токен",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignBotToTokenHandler = async () => {
    if (!newAssignment.token_id || !newAssignment.bot_id) {
      toast({
        title: "Ошибка",
        description: "Выберите токен и введите ID бота",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Use our utility function instead of direct Supabase calls
      await assignBotToToken(newAssignment.token_id, newAssignment.bot_id);
      
      toast({
        title: "Успешно",
        description: "Бот назначен токену",
      });
      
      setNewAssignment({ token_id: "", bot_id: "" });
      fetchAssignedBots();
    } catch (error) {
      console.error("Error assigning bot to token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить бота токену",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAssignmentHandler = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это назначение?")) return;
    
    try {
      setIsSubmitting(true);
      // Use our utility function instead of direct Supabase calls
      await removeAssignment(id);
      
      toast({
        title: "Успешно",
        description: "Назначение удалено",
      });
      
      fetchAssignedBots();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить назначение",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Скопировано",
          description: "Токен скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать токен: ", err);
      }
    );
  };

  const handleBackToChat = () => {
    navigate(token ? `/chat?token=${token}` : '/chat');
  };

  // Admin Login Form
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Key className="h-5 w-5" />
              Вход в панель управления токенами
            </CardTitle>
            <CardDescription>
              Введите учетные данные для доступа к панели управления
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Имя пользователя</label>
                <Input 
                  id="username"
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Имя пользователя"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Пароль</label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdminLogin();
                    }
                  }}
                />
              </div>
              {authError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {authError}
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={handleAdminLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : "Войти"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleBackToChat}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к чату
              </Button>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Подсказка: Используйте admin/admin
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6" />
          Управление токенами
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleAdminLogout} variant="outline">
            Выйти из админ-панели
          </Button>
          <Button onClick={handleBackToChat} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Вернуться к чату
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens Management */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> 
              Токены доступа
            </CardTitle>
            <CardDescription>
              Управление токенами доступа для приложений
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Токен</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((tokenRecord, index) => (
                      <TableRow key={tokenRecord.id}>
                        <TableCell>
                          <Input 
                            value={tokenRecord.name} 
                            onChange={(e) => handleTokenChange(index, 'name', e.target.value)}
                            className="max-w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-secondary px-2 py-1 rounded text-xs font-mono truncate max-w-32 sm:max-w-40 md:max-w-32 lg:max-w-40">
                              {tokenRecord.token}
                            </code>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => copyToClipboard(tokenRecord.token)}
                                    className="h-7 w-7"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Копировать токен</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={tokenRecord.description || ''} 
                            onChange={(e) => handleTokenChange(index, 'description', e.target.value)}
                            placeholder="Описание"
                            className="max-w-36"
                          />
                        </TableCell>
                        <TableCell className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => saveToken(tokenRecord)} disabled={isSubmitting}>
                                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Сохранить изменения</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="destructive" onClick={() => deleteTokenHandler(tokenRecord.id)} disabled={isSubmitting}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удалить токен</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tokens.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Нет доступных токенов. Создайте новый токен ниже.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить новый токен
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input 
                  name="name"
                  value={newToken.name}
                  onChange={handleInputChange}
                  placeholder="Название приложения"
                />
                <Input 
                  name="description"
                  value={newToken.description}
                  onChange={handleInputChange}
                  placeholder="Описание (опционально)"
                />
              </div>
              <Button onClick={addNewToken} className="mt-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Добавление...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить токен
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token-Bot Assignments - Simplified version */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> 
              Назначение ботов токенам
            </CardTitle>
            <CardDescription>
              Привязка ботов к токенам доступа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 rounded-md border bg-card/50">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить назначение
              </h3>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Выберите токен</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={newAssignment.token_id}
                    onChange={(e) => setNewAssignment(prev => ({...prev, token_id: e.target.value}))}
                  >
                    <option value="">Выберите токен</option>
                    {tokens.map(token => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.token.length > 12 ? token.token.substring(0, 12) + '...' : token.token})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">ID бота</label>
                  <Input 
                    placeholder="Введите ID бота"
                    value={newAssignment.bot_id}
                    onChange={(e) => setNewAssignment(prev => ({...prev, bot_id: e.target.value}))}
                  />
                </div>
              </div>
              <Button onClick={assignBotToTokenHandler} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Назначение...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Назначить бота
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Токен</TableHead>
                    <TableHead>ID Бота</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedBots.map((assignment) => {
                    const token = tokens.find(t => t.id === assignment.token_id);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <span className="font-medium">{token?.name || 'Unknown'}</span>
                          <div className="text-xs text-muted-foreground truncate max-w-32 sm:max-w-40 md:max-w-32 lg:max-w-40">
                            {token?.token}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-secondary px-2 py-1 rounded text-xs font-mono">
                            {assignment.bot_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => removeAssignmentHandler(assignment.id)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удалить назначение</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {assignedBots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Нет назначений. Добавьте новое назначение выше.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenAdmin;
