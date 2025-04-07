
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [newAssignment, setNewAssignment] = useState({ token_id: "", bot_id: "" });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
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
    setAuthError("");
    
    // Simulate network delay for better UX
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        setIsAuthenticated(true);
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
      
      // Use our utility function to fetch tokens from the database
      const data = await getTokens();
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные токенов",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedBots = async () => {
    try {
      setLoadingAssignments(true);
      // Use our utility function to fetch bot assignments from the database
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

  const validateToken = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newToken.name.trim()) {
      errors.name = "Название токена обязательно";
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAssignment = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newAssignment.token_id) {
      errors.token_id = "Выберите токен";
    }
    
    if (!newAssignment.bot_id.trim()) {
      errors.bot_id = "ID бота обязателен";
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewToken(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleTokenChange = (index: number, field: string, value: string) => {
    const updatedTokens = [...tokens];
    updatedTokens[index] = { ...updatedTokens[index], [field]: value };
    setTokens(updatedTokens);
  };

  const saveToken = async (tokenRecord: TokenRecord) => {
    try {
      setIsSubmitting(true);
      // Use our utility function to update the token in the database
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
    if (!validateToken()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const tokenValue = generateToken(newToken.name);
      
      // Use our utility function to add the token to the database
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
      // Use our utility function to delete the token from the database
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
    if (!validateAssignment()) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Use our utility function to assign a bot to a token in the database
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
      // Use our utility function to remove a bot assignment from the database
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
            <form 
              className="space-y-4" 
              onSubmit={(e) => {
                e.preventDefault();
                handleAdminLogin();
              }}
            >
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
                type="submit"
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
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к чату
              </Button>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Подсказка: Используйте admin/admin
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6" />
          Управление токенами
        </h1>
        <div className="flex flex-wrap gap-2">
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
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {tokens.length > 0 ? (
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
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert className="bg-muted/50">
                    <AlertDescription className="text-center py-6 text-muted-foreground">
                      Нет доступных токенов. Создайте новый токен ниже.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить новый токен
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                addNewToken();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input 
                      name="name"
                      value={newToken.name}
                      onChange={handleInputChange}
                      placeholder="Название приложения*"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <Input 
                    name="description"
                    value={newToken.description}
                    onChange={handleInputChange}
                    placeholder="Описание (опционально)"
                  />
                </div>
                <Button type="submit" className="mt-3" disabled={isSubmitting}>
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
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Token-Bot Assignments */}
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
              <form onSubmit={(e) => {
                e.preventDefault();
                assignBotToTokenHandler();
              }}>
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium mb-1 block">Выберите токен*</label>
                    <select 
                      className={`w-full rounded-md border ${errors.token_id ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
                      value={newAssignment.token_id}
                      onChange={(e) => {
                        setNewAssignment(prev => ({...prev, token_id: e.target.value}));
                        
                        // Clear error when user selects a token
                        if (errors.token_id) {
                          setErrors(prev => {
                            const updated = { ...prev };
                            delete updated.token_id;
                            return updated;
                          });
                        }
                      }}
                      disabled={loading || tokens.length === 0}
                    >
                      <option value="">Выберите токен</option>
                      {tokens.map(token => (
                        <option key={token.id} value={token.id}>
                          {token.name} ({token.token.length > 12 ? token.token.substring(0, 12) + '...' : token.token})
                        </option>
                      ))}
                    </select>
                    {errors.token_id && (
                      <p className="text-xs text-destructive">{errors.token_id}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium mb-1 block">ID бота*</label>
                    <Input 
                      placeholder="Введите ID бота"
                      value={newAssignment.bot_id}
                      onChange={(e) => {
                        setNewAssignment(prev => ({...prev, bot_id: e.target.value}));
                        
                        // Clear error when user types
                        if (errors.bot_id) {
                          setErrors(prev => {
                            const updated = { ...prev };
                            delete updated.bot_id;
                            return updated;
                          });
                        }
                      }}
                      className={errors.bot_id ? "border-destructive" : ""}
                    />
                    {errors.bot_id && (
                      <p className="text-xs text-destructive">{errors.bot_id}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting || tokens.length === 0} className="w-full">
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
                {tokens.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Создайте токен, прежде чем добавлять назначения
                  </p>
                )}
              </form>
            </div>

            {loadingAssignments ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {assignedBots.length > 0 ? (
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
                                {token ? (
                                  <>
                                    <span className="font-medium">{token.name}</span>
                                    <div className="text-xs text-muted-foreground truncate max-w-32 sm:max-w-40 md:max-w-32 lg:max-w-40">
                                      {token.token}
                                    </div>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                    Токен не найден
                                  </Badge>
                                )}
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
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert className="bg-muted/50">
                    <AlertDescription className="text-center py-6 text-muted-foreground">
                      Нет назначений. Добавьте новое назначение выше.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenAdmin;
