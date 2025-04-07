
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AssignedBots } from "@/components/AssignedBots";

export default function Index() {
  const { token, logout } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Добро пожаловать</h1>
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>

      <Card>
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
