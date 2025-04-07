
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Bot, Key, AlertTriangle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function AssignedBots() {
  const { assignedBots, token, fetchAssignedBots } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Refetch assigned bots when the component mounts or the token changes
  useEffect(() => {
    if (token) {
      fetchAssignedBots(token);
    }
  }, [token, fetchAssignedBots]);

  const copyToClipboard = (text: string | undefined, type: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Скопировано",
          description: `${type} скопирован в буфер обмена`,
        });
      })
      .catch(() => {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать текст",
          variant: "destructive",
        });
      });
  };

  const openChat = (botId: string) => {
    navigate(`/chat?token=${token}&bot=${botId}`);
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Назначенные боты</CardTitle>
          <CardDescription>Войдите с токеном доступа чтобы увидеть назначенных ботов</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (assignedBots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Назначенные боты</CardTitle>
          <CardDescription>К этому токену доступа не назначено ботов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-700 dark:text-amber-300">
              К этому токену доступа пока не назначено ни одного бота. Обратитесь к администратору системы.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Назначенные боты</CardTitle>
        <CardDescription>Боты, назначенные к вашему токену доступа</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignedBots.map((bot) => (
            <div key={bot.id} className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">{bot.bot_name || "Бот"} ({bot.bot_id})</h3>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Бот</Badge>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => openChat(bot.bot_id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Чат
                  </Button>
                </div>
              </div>
              
              {bot.bot_token && (
                <div className="mt-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 bg-muted p-2 rounded text-sm truncate">
                    {bot.bot_token}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(bot.bot_token, "Токен бота")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
