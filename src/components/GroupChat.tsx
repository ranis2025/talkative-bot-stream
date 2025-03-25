
import { useRef, useEffect, useState } from "react";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { IChat, ChatBot, IMessage, IFile } from "@/types/chat";
import { AlertTriangle, UserPlus, AtSign, Settings, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface GroupChatProps {
  chat: IChat | undefined;
  onSendMessage: (message: string, files?: IFile[], specificBotId?: string | null) => void;
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
  const [inputValue, setInputValue] = useState("");
  const [isAtMention, setIsAtMention] = useState(false);
  const [isDiscussionActive, setIsDiscussionActive] = useState(false);
  const [mentionBotId, setMentionBotId] = useState<string | null>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [chat?.messages]);

  // Monitor input for @ mentions - only show when @ is typed
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Check for @ symbol to show mention dropdown
    if (value.includes("@") && !isAtMention) {
      const lastAtIndex = value.lastIndexOf("@");
      const isAtLastPosition = lastAtIndex === value.length - 1 || 
                             value.substring(lastAtIndex + 1).trim() === "";
      if (isAtLastPosition) {
        setIsAtMention(true);
      }
    } else if (!value.includes("@")) {
      setIsAtMention(false);
      setMentionBotId(null);
    }
  };

  // Select bot for mention
  const handleSelectMentionBot = (botId: string) => {
    setMentionBotId(botId);
    const botName = userBots.find(bot => bot.bot_id === botId)?.name || "Bot";
    setInputValue(`@${botName}: `);
    setIsAtMention(false);
  };

  // Handle message sending
  const handleSendMessage = (message: string, files?: IFile[]) => {
    if (!chat || activeBotsInChat.length === 0) return;
    
    // Extract actual message content if there's a mention
    let actualMessage = message;
    let targetBotId = mentionBotId;
    
    if (message.startsWith("@")) {
      const colonIndex = message.indexOf(": ");
      if (colonIndex > -1) {
        actualMessage = message.substring(colonIndex + 2);
      }
    }
    
    // Set discussion active flag to prevent user from sending new messages
    // until all bots have responded
    setIsDiscussionActive(true);
    
    // Send message with mentioned bot if any
    onSendMessage(actualMessage, files, targetBotId);
    
    // Reset mention state
    setMentionBotId(null);
    setInputValue("");
  };

  // Check if discussion is complete (all bots have responded)
  useEffect(() => {
    if (!chat || !isDiscussionActive) return;
    
    // Get last messages sequence
    const messages = chat.messages;
    if (messages.length === 0) return;
    
    // Find the last user message
    let lastUserMsgIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }
    
    if (lastUserMsgIndex === -1) return;
    
    // Count bot responses after the last user message
    const botResponses = messages.slice(lastUserMsgIndex + 1).filter(msg => msg.role === "bot");
    const uniqueBotsResponded = new Set(botResponses.map(msg => msg.bot_id));
    
    // If all bots have responded, stop the discussion
    if (uniqueBotsResponded.size >= activeBotsInChat.length) {
      setIsDiscussionActive(false);
    }
  }, [chat, isDiscussionActive, activeBotsInChat]);

  // If no active chat
  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-medium">Добро пожаловать в Групповой Чат</h2>
          <p className="text-muted-foreground">
            Создайте новый групповой чат или выберите существующий, чтобы начать общение с несколькими ботами.
          </p>
        </div>
      </div>
    );
  }
  
  const hasErrorMessage = chat.messages.length > 0 && 
    chat.messages[chat.messages.length - 1].role === "bot" && 
    (chat.messages[chat.messages.length - 1].content.includes("Ошибка:") || 
     chat.messages[chat.messages.length - 1].content.includes("Сервер временно недоступен"));

  // Map botIds to their names for display
  const getBotNameById = (botId: string): string => {
    const bot = userBots.find(b => b.bot_id === botId);
    return bot?.name || "Бот";
  };
  
  // Filter non-selected bots for adding to chat
  const nonSelectedBots = userBots.filter(bot => !activeBotsInChat.includes(bot.bot_id));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
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
            <div className="px-4 py-2">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Боты в этом чате</h3>
                {activeBotsInChat.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет активных ботов. Добавьте ботов для начала общения.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeBotsInChat.map(botId => {
                      const bot = userBots.find(b => b.bot_id === botId);
                      return (
                        <Badge key={botId} variant="secondary" className="flex items-center gap-1 justify-between">
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {bot?.name || "Бот"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 rounded-full ml-1" 
                            onClick={() => onRemoveBotFromChat(botId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {nonSelectedBots.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Добавить бота в чат</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {nonSelectedBots.map((bot) => (
                      <Button
                        key={bot.bot_id}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => onAddBotToChat(bot.bot_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {bot.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Закрыть настройки</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-medium">Добавьте ботов и начните общение</h2>
              <p className="text-muted-foreground">
                Добавьте ботов через настройки чата и введите сообщение в поле ниже, чтобы начать групповую беседу.
              </p>
            </div>
          </div>
        ) : (
          <>
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
            {isLoading && (
              <div className="bot-message self-start max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse delay-75"></div>
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
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
    </div>
  );
}
