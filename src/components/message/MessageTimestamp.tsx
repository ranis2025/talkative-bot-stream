
import React, { useState } from "react";
import { IMessage } from "@/types/chat";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle, Clock, CheckCheck, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MessageTimestampProps {
  message: IMessage;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ message }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: ru });
  
  // Function to copy message content to clipboard
  const copyMessageContent = () => {
    if (!message.content) return;
    
    navigator.clipboard.writeText(message.content)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Скопировано",
          description: "Текст сообщения скопирован в буфер обмена",
        });
        
        // Reset copy state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Error copying text:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать текст",
          variant: "destructive",
        });
      });
  };
  
  return (
    <div className="flex items-center justify-end gap-1 mt-2">
      <button
        onClick={copyMessageContent}
        className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100"
        title="Копировать текст"
      >
        {isCopied ? (
          <CheckCheck className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <div className="text-xs text-muted-foreground flex items-center">
        {isBot ? (
          <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
        ) : (
          <Clock className="h-3 w-3 mr-1" />
        )}
        {formattedTime}
      </div>
    </div>
  );
};
