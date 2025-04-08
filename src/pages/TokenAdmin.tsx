
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Save, Plus, Trash2, ArrowLeft, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [newAssignment, setNewAssignment] = useState({ token_id: "", bot_id: "", bot_token: "", bot_name: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Define the form schema
  const formSchema = z.object({
    token_id: z.string().min(1, "Выберите токен"),
    bot_id: z.string().min(1, "ID бота обязателен"),
    bot_token: z.string().min(1, "Токен бота обязателен"),
    bot_name: z.string().min(1, "Название бота обязательно"),
  });

  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token_id: "",
      bot_id: "",
      bot_token: "",
      bot_name: "",
    },
  });

  // Ensure token is preserved in URL
  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  // Admin login handler
  const handleAdminLogin = () => {
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      setAuthError("");
      localStorage.setItem("token_admin_auth", "true");
    } else {
      setAuthError("Неверное имя пользователя или пароль");
    }
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
    }
  };

  const deleteTokenHandler = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот токен?")) return;
    
    try {
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
    }
  };

  const onSubmitAssignment = async (values: z.infer<typeof formSchema>) => {
    try {
      // Use our utility function instead of direct Supabase calls
      await assignBotToToken(values.token_id, values.bot_id, values.bot_token, values.bot_name);
      
      toast({
        title: "Успешно",
        description: "Бот назначен токену",
      });
      
      setDialogOpen(false);
      form.reset();
      fetchAssignedBots();
    } catch (error) {
      console.error("Error assigning bot to token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить бота токену",
        variant: "destructive"
      });
    }
  };

  const removeAssignmentHandler = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это назначение?")) return;
    
    try {
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Вход в панель управления токенами</CardTitle>
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
                <div className="text-red-500 text-sm">{authError}</div>
              )}
              <Button 
                className="w-full" 
                onClick={handleAdminLogin}
              >
                Войти
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleBackToChat}
              >
                Вернуться к чату
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление токенами</h1>
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
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Токены доступа</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
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
                        />
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <div className="truncate max-w-[140px]">{tokenRecord.token}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(tokenRecord.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={tokenRecord.description || ''} 
                          onChange={(e) => handleTokenChange(index, 'description', e.target.value)}
                          placeholder="Описание"
                        />
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button size="sm" onClick={() => saveToken(tokenRecord)}>
                          <Save className="h-4 w-4 mr-1" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTokenHandler(tokenRecord.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Добавить новый токен</h3>
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
              <Button onClick={addNewToken} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Добавить токен
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token-Bot Assignments - Updated to include bot token and name */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Назначение ботов токенам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Назначить бота
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Назначить бота токену</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitAssignment)} className="space-y-4 py-4">
                      <FormField
                        control={form.control}
                        name="token_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Токен авторизации</FormLabel>
                            <select 
                              className="w-full p-2 border rounded"
                              {...field}
                            >
                              <option value="">Выберите токен</option>
                              {tokens.map(token => (
                                <option key={token.id} value={token.id}>
                                  {token.name} ({token.token})
                                </option>
                              ))}
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bot_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Бота</FormLabel>
                            <FormControl>
                              <Input placeholder="Введите ID бота" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bot_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Токен Бота</FormLabel>
                            <FormControl>
                              <Input placeholder="Введите токен бота" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bot_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название Бота</FormLabel>
                            <FormControl>
                              <Input placeholder="Введите название бота" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Назначить</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Токен</TableHead>
                    <TableHead>Бот</TableHead>
                    <TableHead>Токен бота</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedBots.map((assignment) => {
                    const token = tokens.find(t => t.id === assignment.token_id);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>{token?.name || 'Unknown Token'}</TableCell>
                        <TableCell>
                          <div>ID: {assignment.bot_id}</div>
                          <div className="text-sm text-muted-foreground">Имя: {assignment.bot_name}</div>
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <div className="truncate max-w-[140px]">{assignment.bot_token}</div>
                          {assignment.bot_token && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyToClipboard(assignment.bot_token || '')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => removeAssignmentHandler(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {assignedBots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Нет назначений
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
