
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AdminCreateDialog from "./AdminCreateDialog";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at?: string;
  password?: string;
}

interface AdminListProps {
  refreshTrigger: number;
  onRefresh: () => void;
}

const AdminList = ({ refreshTrigger, onRefresh }: AdminListProps) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, [refreshTrigger]);

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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Администраторы</CardTitle>
        <CardDescription>Управление администраторами системы</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <AdminCreateDialog onAdminCreated={onRefresh} />
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
  );
};

export default AdminList;
