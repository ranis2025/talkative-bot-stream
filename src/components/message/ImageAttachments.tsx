
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, CheckCheck, Copy, Images, ImageIcon } from "lucide-react";
import { useState } from "react";
import { MessageTimestamp } from "./MessageTimestamp";

interface ImageAttachmentsProps {
  message: IMessage;
  imageLinks: string[];
  formattedTime: string;
  onCopy: () => void;
  isCopied: boolean;
}

export function ImageAttachments({ 
  message, 
  imageLinks, 
  formattedTime, 
  onCopy, 
  isCopied 
}: ImageAttachmentsProps) {
  const [imageLoaded, setImageLoaded] = useState<{[key: string]: boolean}>({});
  
  // Handle image load
  const handleImageLoad = (imageUrl: string) => {
    setImageLoaded(prev => ({...prev, [imageUrl]: true}));
  };

  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-2xl max-w-[80%] shadow-sm transition-all",
        "bg-secondary/50 text-secondary-foreground self-start border-l-4 border-primary/30 bot-message"
      )}
      style={{ float: "left", clear: "both" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        {message.bot_name && (
          <div className="text-xs font-medium text-primary flex items-center gap-1">
            {message.bot_name} 
            {message.bot_id && <span className="text-muted-foreground text-[10px]">(ID: {message.bot_id})</span>}
          </div>
        )}
      </div>
      
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-1 mb-2">
          <Images className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Изображения из ответа:</span>
        </div>
        
        {imageLinks.map((imageUrl, index) => (
          <div key={index} className="relative">
            {!imageLoaded[imageUrl] && (
              <div className="bg-muted/30 animate-pulse h-40 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
            <img 
              src={imageUrl} 
              alt={`Изображение ${index + 1}`} 
              className={cn(
                "w-full rounded-md max-h-80 object-contain bg-black/5", 
                !imageLoaded[imageUrl] && "hidden"
              )}
              onLoad={() => handleImageLoad(imageUrl)}
            />
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end gap-1 mt-2">
        <button
          onClick={onCopy}
          className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50"
          title="Копировать текст"
        >
          {isCopied ? (
            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <MessageTimestamp isBot={true} formattedTime={formattedTime} />
      </div>
    </div>
  );
}
