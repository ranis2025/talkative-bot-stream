
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Bot, CheckCircle, Clock, Copy, CheckCheck, User } from "lucide-react";
import { useState, useEffect } from "react";
import { MessageContent } from "./MessageContent";
import { ImageAttachments } from "./ImageAttachments";
import { FileAttachments } from "./FileAttachments";
import { AudioAttachments } from "./AudioAttachments";
import { MessageTimestamp } from "./MessageTimestamp";
import { useFileExtractor } from "./useFileExtractor";
import { toast } from "@/hooks/use-toast";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: ru });
  const [isCopied, setIsCopied] = useState(false);
  
  const {
    extractedImageLinks,
    extractedFileLinks,
    extractedAudioLinks
  } = useFileExtractor(isBot, message.content);
  
  // Reset copy state after 2 seconds
  useEffect(() => {
    let copyTimeout: number | null = null;
    if (isCopied) {
      copyTimeout = window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
    return () => {
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
    };
  }, [isCopied]);
  
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
  
  // If bot message has audio links, show them as a voice message instead of the original message
  if (isBot && extractedAudioLinks.length > 0) {
    return (
      <AudioAttachments 
        message={message} 
        audioLinks={extractedAudioLinks} 
        formattedTime={formattedTime} 
        onCopy={copyMessageContent} 
        isCopied={isCopied} 
      />
    );
  }
  
  // Original message (only show if there are no audio links for bot messages)
  const showRegularMessage = !isBot || (isBot && extractedAudioLinks.length === 0);
  
  // Show extracted image links in separate bot message first
  return (
    <>
      {isBot && extractedImageLinks.length > 0 && (
        <ImageAttachments 
          message={message} 
          imageLinks={extractedImageLinks} 
          formattedTime={formattedTime} 
          onCopy={copyMessageContent} 
          isCopied={isCopied} 
        />
      )}
      
      {isBot && extractedFileLinks.length > 0 && (
        <FileAttachments 
          message={message} 
          fileLinks={extractedFileLinks} 
          formattedTime={formattedTime} 
          onCopy={copyMessageContent} 
          isCopied={isCopied} 
        />
      )}
      
      {showRegularMessage && (
        <div
          className={cn(
            "flex flex-col p-4 rounded-2xl max-w-[80%] shadow-sm transition-all group",
            isBot
              ? "bg-secondary/50 text-secondary-foreground self-start border-l-4 border-primary/30 bot-message"
              : "bg-primary/10 text-foreground self-end border-r-4 border-primary/70 user-message"
          )}
          style={{ float: isBot ? "left" : "right", clear: "both" }}
        >
          <div className="flex items-center gap-2 mb-1">
            {isBot ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                {message.bot_name && (
                  <div className="text-xs font-medium text-primary flex items-center gap-1">
                    {message.bot_name} 
                    {message.bot_id && <span className="text-muted-foreground text-[10px]">(ID: {message.bot_id})</span>}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-xs font-medium">Вы</div>
              </>
            )}
          </div>
          
          <MessageContent message={message} />
          
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
            <MessageTimestamp isBot={isBot} formattedTime={formattedTime} />
          </div>
        </div>
      )}
    </>
  );
}
