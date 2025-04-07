
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, UserPlus, X } from "lucide-react";
import { DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { ChatBot } from "@/types/chat";

interface ChatSettingsProps {
  userBotsInChat: string[];
  onAddBotToGroupChat: (botId: string) => void;
  onRemoveBotFromGroupChat: (botId: string) => void;
  activeBotsInChat: string[];
}

export function ChatSettings({
  userBotsInChat,
  onAddBotToGroupChat,
  onRemoveBotFromGroupChat,
  activeBotsInChat,
}: ChatSettingsProps) {
  const nonSelectedBots = userBotsInChat
    .filter(bot => !activeBotsInChat.includes(bot));
  
  return (
    <div className="px-4 py-2">
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Боты в этом чате</h3>
        {activeBotsInChat.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет активных ботов. Добавьте ботов для начала общения.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeBotsInChat.map(botId => (
              <Badge key={botId} variant="secondary" className="flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  {botId}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 rounded-full ml-1" 
                  onClick={() => onRemoveBotFromGroupChat(botId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {nonSelectedBots.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Добавить бота в чат</h3>
          <div className="grid grid-cols-2 gap-2">
            {nonSelectedBots.map((bot) => (
              <Button
                key={bot}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => onAddBotToGroupChat(bot)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {bot}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="outline">Закрыть настройки</Button>
        </DrawerClose>
      </DrawerFooter>
    </div>
  );
}
