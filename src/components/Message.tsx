
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const formattedTime = format(new Date(message.timestamp), 'HH:mm', { locale: ru });

  return (
    <div className={cn(
      "flex flex-col mb-4",
      isUser ? "items-end" : "items-start"
    )}>
      <div className={cn(
        isUser ? "user-message" : "bot-message"
      )}>
        <div className="whitespace-pre-line">{message.content}</div>
      </div>
      <span className="text-xs text-muted-foreground mt-1 px-2">
        {formattedTime}
      </span>
    </div>
  );
}
