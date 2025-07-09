
import React from "react";
import { IMessage } from "@/types/chat";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle, Clock, CheckCheck, Copy, FileText } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MessageTimestampProps {
  message: IMessage;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ message }) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "dd.MM.yyyy HH:mm", { locale: ru });
  
  // Function to copy message content to clipboard
  const handleCopyMessage = async () => {
    if (!message.content) return;
    
    const result = await copyToClipboard(message.content);
    
    // Log result for debugging
    console.log("Copy result:", result);
  };
  
  return (
    <div className="flex items-center justify-end gap-1 mt-2">
      <button
        onClick={handleCopyMessage}
        className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100"
        title="Копировать текст"
      >
        {isCopied ? (
          <CheckCheck className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      
      {/* Кнопка просмотра логов сервера (только для сообщений бота) */}
      {isBot && message.server_logs && (
        <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
          <DialogTrigger asChild>
            <button
              className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100"
              title="Посмотреть логи сервера"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Логи ответа сервера</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                {message.server_logs}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
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
