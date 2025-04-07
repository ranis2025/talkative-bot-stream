
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Bot, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AssignedBots() {
  const { assignedBots } = useAuth();
  const { toast } = useToast();

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

  if (assignedBots.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Назначенные боты</CardTitle>
          <CardDescription>К этому токену доступа не назначено ботов</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
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
                  <h3 className="font-medium">{bot.bot_id}</h3>
                </div>
                <Badge variant="outline">Бот</Badge>
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
