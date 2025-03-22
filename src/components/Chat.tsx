import { useRef, useEffect } from "react";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { IChat } from "@/types/chat";
interface ChatProps {
  chat: IChat | undefined;
  onSendMessage: (message: string) => void;
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