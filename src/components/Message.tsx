
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: ru });
  
  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-screen-md mx-auto p-4 rounded-lg",
        isBot
          ? "bg-secondary/50 text-secondary-foreground"
          : "bg-primary/10 text-foreground ml-auto"
      )}
    >
      {isBot && message.bot_name && (
        <div className="text-xs font-medium mb-1 text-primary">
          {message.bot_name}
        </div>
      )}
      <div className="whitespace-pre-wrap">{message.content}</div>
      <div className="text-xs text-muted-foreground mt-2 self-end">
        {formattedTime}
      </div>
    </div>
  );
}
