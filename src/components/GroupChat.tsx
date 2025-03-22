
import { useRef, useEffect, useState } from "react";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { IChat, ChatBot, IMessage, IFile } from "@/types/chat";
import { AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface GroupChatProps {
  chat: IChat | undefined;
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading: boolean;
  userBots: ChatBot[];
  onAddBotToChat: (botId: string) => void;
  onRemoveBotFromChat: (botId: string) => void;
  activeBotsInChat: string[];
}

export function GroupChat({
  chat,
  onSendMessage,
  isLoading,
  userBots,
  onAddBotToChat,
  onRemoveBotFromChat,
  activeBotsInChat
}: GroupChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [chat?.messages]);

  // If no active chat
  if (!chat) {
    return <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-medium">Добро пожаловать в Групповой Чат</h2>
          <p className="text-muted-foreground">
            Создайте новый групповой чат или выберите существующий, чтобы начать общение с несколькими ботами.
          </p>
        </div>
      </div>;
  }
  
  const hasErrorMessage = chat.messages.length > 0 && 
    chat.messages[chat.messages.length - 1].role === "bot" && 
    (chat.messages[chat.messages.length - 1].content.includes("Ошибка:") || 
     chat.messages[chat.messages.length - 1].content.includes("Сервер временно недоступен"));

  const handleAddBot = () => {
    if (selectedBot && !activeBotsInChat.includes(selectedBot)) {
      console.log("Adding bot to chat:", selectedBot);
      onAddBotToChat(selectedBot);
      setSelectedBot(null);
    }
  };

  const handleRemoveBot = (botId: string) => {
    console.log("Removing bot from chat:", botId);
    onRemoveBotFromChat(botId);
  };

  const nonSelectedBots = userBots.filter(bot => !activeBotsInChat.includes(bot.bot_id));

  // Map botIds to their names for display
  const getBotNameById = (botId: string): string => {
    const bot = userBots.find(b => b.bot_id === botId);
    return bot?.name || "Бот";
  };

  return <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium mr-2">Боты в чате:</span>
        {activeBotsInChat.length === 0 ? (
          <span className="text-sm text-muted-foreground">Добавьте ботов в чат</span>
        ) : (
          activeBotsInChat.map(botId => {
            const bot = userBots.find(b => b.bot_id === botId);
            return (
              <Badge key={botId} variant="secondary" className="flex items-center gap-1">
                {bot?.name || "Бот"} (ID: {botId})
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 rounded-full" 
                  onClick={() => handleRemoveBot(botId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })
        )}
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Select
            value={selectedBot || ""}
            onValueChange={setSelectedBot}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите бота" />
            </SelectTrigger>
            <SelectContent>
              {nonSelectedBots.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Все боты уже добавлены</div>
              ) : (
                nonSelectedBots.map((bot) => (
                  <SelectItem key={bot.bot_id} value={bot.bot_id}>
                    {bot.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddBot}
            disabled={!selectedBot || nonSelectedBots.length === 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Добавить бота
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-medium">Добавьте ботов и начните общение</h2>
              <p className="text-muted-foreground">
                Добавьте нескольких ботов и введите сообщение в поле ниже, чтобы начать групповую беседу.
              </p>
            </div>
          </div> : <>
            {chat.messages.map(message => (
              <Message 
                key={message.id} 
                message={message} 
              />
            ))}
            {hasErrorMessage && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4" />
                <span>Произошла ошибка при обработке запроса. Если проблема повторяется, обратитесь в службу поддержки.</span>
              </div>
            )}
            {isLoading && <div className="bot-message">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse delay-75"></div>
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>}
            <div ref={messagesEndRef} />
          </>}
      </div>
      <div className="p-4 bg-gradient-to-t from-background to-transparent pt-6">
        <MessageInput 
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          placeholder={activeBotsInChat.length === 0 ? "Сначала добавьте ботов в чат..." : "Напишите сообщение..."}
          disabled={activeBotsInChat.length === 0}
        />
      </div>
    </div>;
}
