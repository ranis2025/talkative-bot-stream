
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LogOut, Users, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminList from "@/components/super-admin/AdminList";
import SuperAdminInfo from "@/components/super-admin/SuperAdminInfo";
import AdminCreateDialog from "@/components/super-admin/AdminCreateDialog";

const SuperAdmin = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
  }, [navigate, toast]);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
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

  const handleGoToDbAdmin = () => {
    navigate("/db-admin");
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Панель Super Admin</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleGoToDbAdmin} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Инструменты БД
            </Button>
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
          <AdminList refreshTrigger={refreshTrigger} onRefresh={refreshData} />
          <SuperAdminInfo />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SuperAdmin;
