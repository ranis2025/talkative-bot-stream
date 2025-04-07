
import { useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { IFile } from "@/types/chat";
import { AtSign } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ChatInputAreaProps {
  onSendMessage: (message: string, files?: IFile[], specificBotId?: string | null) => void;
  isLoading: boolean;
  isDiscussionActive: boolean;
  activeBotsInChat: string[];
  getBotNameById: (botId: string) => string;
}

export function ChatInputArea({
  onSendMessage,
  isLoading,
  isDiscussionActive,
  activeBotsInChat,
  getBotNameById,
}: ChatInputAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [isAtMention, setIsAtMention] = useState(false);
  const [mentionBotId, setMentionBotId] = useState<string | null>(null);
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.includes("@") && !isAtMention) {
      setIsAtMention(true);
    } else if (!value.includes("@") && isAtMention) {
      setIsAtMention(false);
      setMentionBotId(null);
    }
  };

  const handleSelectMentionBot = (botId: string) => {
    setMentionBotId(botId);
    const botName = getBotNameById(botId);
    setInputValue(`@${botName}: `);
    setIsAtMention(false);
  };

  const handleSendMessage = (message: string, files?: IFile[]) => {
    if (activeBotsInChat.length === 0) return;
    
    let actualMessage = message;
    let targetBotId = mentionBotId;
    
    if (message.startsWith("@")) {
      const colonIndex = message.indexOf(": ");
      if (colonIndex > -1) {
        actualMessage = message.substring(colonIndex + 2);
      }
    }
    
    onSendMessage(actualMessage, files, targetBotId);
    setMentionBotId(null);
    setInputValue("");
  };
  
  return (
    <div className="p-4 bg-gradient-to-t from-background to-transparent pt-6">
      <Popover open={isAtMention} onOpenChange={(open) => setIsAtMention(open)}>
        <PopoverTrigger asChild>
          <div className="w-full">
            <MessageInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading || isDiscussionActive} 
              placeholder={
                isDiscussionActive ? "Дождитесь окончания обсуждения..." : 
                activeBotsInChat.length === 0 ? "Сначала добавьте ботов в чат через настройки..." : 
                "Напишите сообщение или @имя_бота для выбора первого отвечающего..."
              }
              disabled={activeBotsInChat.length === 0 || isDiscussionActive}
              activeBotsCount={activeBotsInChat.length}
              value={inputValue}
              onChange={handleInputChange}
              leftIcon={isAtMention ? <AtSign className="h-5 w-5 text-primary" /> : undefined}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="text-sm font-medium mb-2">Выберите бота для начала обсуждения:</div>
          <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto">
            {activeBotsInChat.map(botId => (
              <Button
                key={botId}
                variant="ghost"
                size="sm"
                className="justify-start text-left"
                onClick={() => handleSelectMentionBot(botId)}
              >
                {getBotNameById(botId)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {isDiscussionActive && (
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Боты обсуждают ваш вопрос. Пожалуйста, дождитесь завершения обсуждения...
        </div>
      )}
    </div>
  );
}
