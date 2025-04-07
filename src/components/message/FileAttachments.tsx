
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, CheckCheck, Copy, FileIcon, Link } from "lucide-react";
import { MessageTimestamp } from "./MessageTimestamp";

interface FileAttachmentsProps {
  message: IMessage;
  fileLinks: {url: string, text: string}[];
  formattedTime: string;
  onCopy: () => void;
  isCopied: boolean;
}

export function FileAttachments({ 
  message, 
  fileLinks, 
  formattedTime, 
  onCopy, 
  isCopied 
}: FileAttachmentsProps) {
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
          <Link className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Файлы из ответа:</span>
        </div>
        
        {fileLinks.map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors">
            <FileIcon className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{file.text}</div>
            </div>
            <a 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
            >
              Открыть
            </a>
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
