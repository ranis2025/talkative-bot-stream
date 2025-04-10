
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const SuperAdminInfo = () => {
  return (
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
  );
};

export default SuperAdminInfo;
