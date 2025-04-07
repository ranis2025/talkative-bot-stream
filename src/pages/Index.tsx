
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, Key } from "lucide-react";
import { AssignedBots } from "@/components/AssignedBots";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { token, logout, assignedBots } = useAuth();
  const navigate = useNavigate();
  
  // Auto-redirect to chat if there are bots assigned
  useEffect(() => {
    if (assignedBots.length > 0) {
      navigate(`/chat?token=${token}`);
    }
  }, [assignedBots, token, navigate]);

  const handleTokenAdminClick = () => {
    navigate(`/token-admin?token=${token}`);
  };
  
  const handleGoToChatClick = () => {
    navigate(`/chat?token=${token}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Добро пожаловать</h1>
        <div className="flex gap-2">
          <Button onClick={handleGoToChatClick}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Перейти в чат
          </Button>
          <Button variant="outline" onClick={handleTokenAdminClick}>
            <Key className="mr-2 h-4 w-4" />
            Управление токенами
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Информация о доступе</CardTitle>
          <CardDescription>Ваш токен доступа</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md text-sm font-mono">
            {token}
          </div>
        </CardContent>
      </Card>

      <AssignedBots />
    </div>
  );
}
