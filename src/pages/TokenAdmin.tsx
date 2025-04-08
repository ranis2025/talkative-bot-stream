import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Plus, Trash2, ArrowLeft, Copy, Info, Check } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const formSchema = z.object({
    token_id: z.string().min(1, "Выберите токен"),
    bot_id: z.string().min(1, "ID бота обязателен"),
    bot_token: z.string().min(1, "Токен бота обязателен"),
    bot_name: z.string().min(1, "Название бота обязательно"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token_id: "",
      bot_id: "",
      bot_token: "",
      bot_name: "",
    },
  });

  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  const handleAdminLogin = () => {
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
  }, [token, isAuthenticated]);

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
    try {
      await deleteToken(id);
      
      toast({
        title: "Успешно",
        description: "Токен удален",
      });
      
      fetchTokens();
      fetchAssignedBots();
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
    try {
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
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
        
        toast({
          title: "Скопировано",
          description: "Токен скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать токен: ", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать токен",
          variant: "destructive"
        });
      }
    );
  };

  const handleBackToChat = () => {
    navigate(token ? `/chat?token=${token}` : '/chat');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Вход в панель управления токенами</CardTitle>
            <CardDescription>Введите учетные данные для доступа к панели администратора</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="username">Имя пользователя</FormLabel>
                <Input 
                  id="username"
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="password">Пароль</FormLabel>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Управление Magic токенами</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Magic токены</CardTitle>
              <CardDescription>Управление Magic токенами для доступа к API</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Токен</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            Нет доступных Magic токенов
                          </TableCell>
                        </TableRow>
                      ) : (
                        tokens.map((tokenRecord, index) => (
                          <TableRow key={tokenRecord.id}>
                            <TableCell>
                              <Input 
                                value={tokenRecord.name} 
                                onChange={(e) => handleTokenChange(index, 'name', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="truncate max-w-[120px] font-mono text-sm">
                                  {tokenRecord.token}
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => copyToClipboard(tokenRecord.token)}
                                      className="h-8 w-8"
                                    >
                                      {copiedToken === tokenRecord.token ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Скопировать токен</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={tokenRecord.description || ''} 
                                onChange={(e) => handleTokenChange(index, 'description', e.target.value)}
                                placeholder="Описание"
                              />
                            </TableCell>
                            <TableCell className="flex justify-end space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" onClick={() => saveToken(tokenRecord)}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Сохранить
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Сохранить изменения</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удаление токена</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите удалить токен "{tokenRecord.name}"? 
                                      Это действие нельзя отменить, и все связанные с этим токеном назначения будут также удалены.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteTokenHandler(tokenRecord.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Добавить новый Magic токен</h3>
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
                  Добавить Magic токен
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Назначение ботов токенам</CardTitle>
              <CardDescription>Управление связями между Magic токенами и ботами</CardDescription>
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
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Назначить бота Magic токену</DialogTitle>
                      <DialogDescription>
                        Свяжите бота с Magic токеном авторизации для доступа к API.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitAssignment)} className="space-y-4 py-4">
                        <FormField
                          control={form.control}
                          name="token_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Magic токен авторизации</FormLabel>
                              <select 
                                className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                              <FormDescription>
                                Уникальный идентификатор бота в системе
                              </FormDescription>
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
                              <FormDescription>
                                Секретный токен для API доступа бота
                              </FormDescription>
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
                              <FormDescription>
                                Отображаемое имя бота
                              </FormDescription>
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

                {loadingAssignments ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Токен</TableHead>
                          <TableHead>Бот</TableHead>
                          <TableHead>Токен бота</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedBots.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              Нет назначений ботов к токенам
                            </TableCell>
                          </TableRow>
                        ) : (
                          assignedBots.map((assignment) => {
                            const token = tokens.find(t => t.id === assignment.token_id);
                            
                            return (
                              <TableRow key={assignment.id}>
                                <TableCell>
                                  <div className="font-medium">{token?.name || 'Неизвестный токен'}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {token?.token}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{assignment.bot_name}</div>
                                  <div className="text-xs text-muted-foreground">ID: {assignment.bot_id}</div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  <div className="flex items-center gap-2">
                                    <div className="truncate max-w-[120px] text-sm font-mono">
                                      {assignment.bot_token}
                                    </div>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => copyToClipboard(assignment.bot_token || '')}
                                          className="h-8 w-8"
                                          disabled={!assignment.bot_token}
                                        >
                                          {copiedToken === assignment.bot_token ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Скопировать токен бота</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="destructive" 
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удаление назначения</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Вы уверены, что хотите удалить связь между ботом "{assignment.bot_name}" и токеном? 
                                          Это действие нельзя отменить.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => removeAssignmentHandler(assignment.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              <div className="flex items-center p-4 bg-muted/50 rounded-md">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                <p className="text-sm">
                  Каждый Magic токен авторизации может быть связан с несколькими ботами. 
                  При удалении токена все его назначения ботам также будут удалены.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TokenAdmin;
