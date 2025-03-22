
import { useRef, useEffect } from "react";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { IChat, IFile } from "@/types/chat";
import { AlertTriangle } from "lucide-react";

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

  // Прокрутка вниз при добавлении нового сообщения
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [chat?.messages]);

  // Если нет активного чата
  if (!chat) {
    return <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-medium">Добро пожаловать в BIZO Чат</h2>
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
        <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>;
}
