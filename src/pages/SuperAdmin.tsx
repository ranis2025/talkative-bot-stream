import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LogOut, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at?: string;
  password?: string;
}

const SuperAdmin = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check auth on load
  useEffect(() => {
    const role = sessionStorage.getItem("admin_role");
    const username = sessionStorage.getItem("admin_username");
    
    if (!role || !username) {
      navigate("/auth");
      return;
    }
    
    if (role !== "super_admin") {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для доступа к этой странице",
        variant: "destructive"
      });
      navigate("/token-admin");
      return;
    }
    
    fetchAdmins();
  }, [navigate, toast]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("role", "admin");
      
      if (error) throw error;
      
      setAdmins(data as AdminUser[] || []);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список администраторов",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!username || !password) {
      setFormError("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("admin_roles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      
      if (existingUser) {
        setFormError("Администратор с таким именем уже существует");
        return;
      }
      
      // Create new admin
      const { error } = await supabase
        .from("admin_roles")
        .insert({
          username,
          password,
          role: "admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Администратор создан",
        description: `Администратор ${username} успешно создан`
      });
      
      // Reset form
      setUsername("");
      setPassword("");
      setFormError("");
      
      // Refresh admin list
      fetchAdmins();
      
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать администратора",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    try {
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Администратор удален",
        description: `Администратор ${username} успешно удален`
      });
      
      // Refresh admin list
      fetchAdmins();
      
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить администратора",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_username");
    navigate("/auth");
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из панели администратора"
    });
  };

  const handleGoToTokenAdmin = () => {
    navigate("/token-admin");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Панель Super Admin</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleGoToTokenAdmin} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Перейти к токенам
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Администраторы</CardTitle>
              <CardDescription>Управление администраторами системы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Создать нового администратора
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать администратора</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Имя пользователя</Label>
                        <Input
                          id="username"
                          placeholder="Введите имя пользователя"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Введите пароль"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {formError && (
                        <div className="text-destructive text-sm">{formError}</div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Отмена</Button>
                      </DialogClose>
                      <Button onClick={handleCreateAdmin}>Создать</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                {loading ? (
                  <div className="p-4 text-center">Загрузка...</div>
                ) : admins.length === 0 ? (
                  <div className="p-4 text-center">Администраторы не найдены</div>
                ) : (
                  <div className="p-4 space-y-4">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{admin.username}</div>
                          <div className="text-sm text-muted-foreground">
                            Создан: {new Date(admin.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                            >
                              Удалить
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Удалить администратора</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Информация о Super Admin</CardTitle>
              <CardDescription>Текущая сессия Super Admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Имя пользователя:</p>
                  <p className="text-lg">{sessionStorage.getItem("admin_username") || "Не авторизован"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Роль:</p>
                  <p className="text-lg">Super Admin</p>
                </div>
                <div className="border-t pt-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Super Admin может создавать и удалять администраторов, которые в свою очередь
                    могут управлять Magic токенами.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SuperAdmin;
