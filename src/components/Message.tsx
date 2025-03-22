
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileIcon, ImageIcon, FileTextIcon } from "lucide-react";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: ru });
  
  // Function to determine file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileTextIcon className="h-5 w-5" />;
    } else {
      return <FileIcon className="h-5 w-5" />;
    }
  };
  
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
      
      {/* Display file attachments if present */}
      {message.files && message.files.length > 0 && (
        <div className="mt-3 space-y-2">
          {message.files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-background/50">
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-primary hover:underline"
                download={file.name}
              >
                Скачать
              </a>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2 self-end">
        {formattedTime}
      </div>
    </div>
  );
}
