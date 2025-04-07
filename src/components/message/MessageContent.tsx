
import { IMessage } from "@/types/chat";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon, FileTextIcon } from "lucide-react";

interface MessageContentProps {
  message: IMessage;
}

export function MessageContent({ message }: MessageContentProps) {
  const [imageLoaded, setImageLoaded] = useState<{[key: string]: boolean}>({});
  
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
  
  // Function to check if a file is an image
  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };
  
  // Handle image load
  const handleImageLoad = (fileUrl: string) => {
    setImageLoaded(prev => ({...prev, [fileUrl]: true}));
  };
  
  return (
    <>
      <div className="whitespace-pre-wrap">{message.content}</div>
      
      {/* Display file attachments if present */}
      {message.files && message.files.length > 0 && (
        <div className="mt-3 space-y-2">
          {message.files.map((file, index) => (
            <div key={index} className="rounded-md overflow-hidden">
              {isImageFile(file.name) ? (
                <div className="relative">
                  {!imageLoaded[file.url] && (
                    <div className="bg-muted/30 animate-pulse h-40 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className={cn(
                      "w-full rounded-md max-h-80 object-contain bg-black/5", 
                      !imageLoaded[file.url] && "hidden"
                    )}
                    onLoad={() => handleImageLoad(file.url)}
                  />
                  <div className="absolute bottom-2 right-2">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      download={file.name}
                      className="text-xs bg-background/80 backdrop-blur-sm text-foreground py-1 px-2 rounded-md hover:bg-background/90 transition-colors flex items-center gap-1"
                    >
                      Скачать
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors">
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
                    download={file.name}
                    className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                  >
                    Скачать
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
