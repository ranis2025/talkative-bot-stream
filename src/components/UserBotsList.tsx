
import { useState, useEffect } from "react";
import { getUserBots, createBot } from "@/lib/authApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ChatBot } from "@/types/chat";
import { Loader2, Plus, Trash, Settings } from "lucide-react";

export function UserBotsList() {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotToken, setNewBotToken] = useState("");
  const [newOpenAIKey, setNewOpenAIKey] = useState("");

  useEffect(() => {
    if (token) {
      loadUserBots();
    }
  }, [token]);

  const loadUserBots = async () => {
    setIsLoading(true);
    try {
      const result = await getUserBots(token);
      if (result.success) {
        setBots(result.bots);
      } else {
        toast({
          title: "Ошибка загрузки ботов",
          description: result.message || "Не удалось загрузить ботов",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading bots:", error);
      toast({
        title: "Ошибка загрузки ботов",
        description: "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBot = async () => {
    if (!newBotName) {
      toast({
        title: "Ошибка",
        description: "Имя бота обязательно",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const botId = uuidv4();
      const result = await createBot(
        token,
        newBotName,
        botId,
        newBotToken || undefined,
        newOpenAIKey || undefined
      );

      if (result) {
        toast({
          title: "Бот создан",
          description: "Новый бот успешно создан",
        });
        loadUserBots();
        setNewBotName("");
        setNewBotToken("");
        setNewOpenAIKey("");
      } else {
        toast({
          title: "Ошибка создания бота",
          description: "Не удалось создать бота",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding bot:", error);
      toast({
        title: "Ошибка создания бота",
        description: "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Загрузка ботов...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Боты пользователя {user?.username}</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить бота
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового бота</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Имя бота</Label>
                <Input
                  id="botName"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="Введите имя бота"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="botToken">Токен бота (не обязательно)</Label>
                <Input
                  id="botToken"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                  placeholder="Введите токен бота (если есть)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API ключ (не обязательно)</Label>
                <Input
                  id="openaiKey"
                  value={newOpenAIKey}
                  onChange={(e) => setNewOpenAIKey(e.target.value)}
                  placeholder="Введите ключ OpenAI API (если есть)"
                  type="password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Отмена</Button>
                </DialogClose>
                <Button disabled={isAdding} onClick={handleAddBot}>
                  {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bots.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-lg">
          <p>У вас пока нет ботов. Создайте своего первого бота!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <div key={bot.bot_id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{bot.name}</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">ID: {bot.bot_id}</p>
              <p className="text-xs text-muted-foreground">Создан: {new Date(bot.created_at).toLocaleString()}</p>
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full">
                  Использовать
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
