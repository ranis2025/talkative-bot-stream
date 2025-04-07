
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChatSettings } from "./ChatSettings";
import { IChat } from "@/types/chat";

interface ChatHeaderProps {
  chat: IChat | undefined;
  userBotsInChat: string[];
  onAddBotToGroupChat: (botId: string) => void;
  onRemoveBotFromGroupChat: (botId: string) => void;
  activeBotsInChat: string[];
}

export function ChatHeader({
  chat,
  userBotsInChat,
  onAddBotToGroupChat,
  onRemoveBotFromGroupChat,
  activeBotsInChat,
}: ChatHeaderProps) {
  if (!chat) return null;
  
  return (
    <div className="p-3 border-b flex justify-between items-center">
      <h2 className="font-medium truncate flex-1">{chat.title}</h2>
      
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">
            <Settings className="h-4 w-4 mr-2" />
            Настройки чата
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Настройки группового чата</DrawerTitle>
          </DrawerHeader>
          <ChatSettings 
            userBotsInChat={userBotsInChat}
            onAddBotToGroupChat={onAddBotToGroupChat}
            onRemoveBotFromGroupChat={onRemoveBotFromGroupChat}
            activeBotsInChat={activeBotsInChat}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
