
import { useRef, useEffect, useLayoutEffect } from "react";
import { Message } from "./Message";
import MessageInput from "./MessageInput";
import { IChat, IFile } from "@/types/chat";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChatProps {
  chat: IChat | undefined;
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading: boolean;
}

export function Chat({
  chat,
  onSendMessage,
  isLoading
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  
  // Extract application name from token if it follows the format "AppName:User"
  const getAppName = () => {
    if (!token) return "ProTalk";
    
    // Check if token follows the expected format
    const tokenParts = token.split(':');
    if (tokenParts.length === 2) {
      return tokenParts[0]; // Return the app name part
    }
    
    return "ProTalk"; // Default fallback
  };
  
  const appName = getAppName();

  // Улучшенная прокрутка с синхронным выполнением
  useLayoutEffect(() => {
    if (!messagesEndRef.current || !chat) return;

    const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior,
          block: "end",
          inline: "nearest"
        });
      });
    };

    // Принудительная прокрутка при любых изменениях
    scrollToBottom('smooth');
  }, [chat?.id, chat?.messages?.length]);

  // Отдельный эффект для мгновенной прокрутки при смене чата
  useLayoutEffect(() => {
    if (!messagesEndRef.current || !chat?.id) return;
    
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: "end", 
        inline: "nearest"
      });
    });
  }, [chat?.id]);

  // Если нет активного чата
  if (!chat) {
    return <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-medium">Добро пожаловать в {appName} Чат</h2>
          <p className="text-muted-foreground">
            Создайте новый чат или выберите существующий, чтобы начать общение с ботом.
          </p>
        </div>
      </div>;
  }
  
  const hasErrorMessage = chat.messages.length > 0 && 
    chat.messages[chat.messages.length - 1].role === "bot" && 
    (chat.messages[chat.messages.length - 1].content.includes("Ошибка:") || 
     chat.messages[chat.messages.length - 1].content.includes("Сервер временно недоступен"));

  return <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-medium">Начните общение с ботом</h2>
              <p className="text-muted-foreground">
                Введите сообщение в поле ниже, чтобы начать диалог с ИИ-ассистентом.
              </p>
            </div>
          </div> : <>
            {chat.messages.map(message => <Message key={message.id} message={message} />)}
            {hasErrorMessage && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4" />
                <span>Произошла ошибка при обработке запроса. Если проблема повторяется, обратитесь в службу поддержки.</span>
              </div>
            )}
            {isLoading && <div className="bot-message self-start max-w-[80%]">
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
        <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>;
}
