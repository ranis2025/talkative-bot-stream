
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { ArrowLeft, UserCog } from "lucide-react";

interface AdminLoginFormProps {
  onLogin: (username: string, password: string) => void;
  onBackToChat: () => void;
  authError: string;
  onSuperAdminRedirect?: () => void;
}

const AdminLoginForm = ({ onLogin, onBackToChat, authError, onSuperAdminRedirect }: AdminLoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onLogin(username, password);
  };

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
                    handleSubmit();
                  }
                }}
              />
            </div>
            {authError && (
              <div className="text-red-500 text-sm">{authError}</div>
            )}
            <Button 
              className="w-full" 
              onClick={handleSubmit}
            >
              Войти
            </Button>
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                className="w-[48%]" 
                onClick={onBackToChat}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к чату
              </Button>
              {onSuperAdminRedirect && (
                <Button 
                  variant="secondary" 
                  className="w-[48%]" 
                  onClick={onSuperAdminRedirect}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Super Admin
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginForm;
