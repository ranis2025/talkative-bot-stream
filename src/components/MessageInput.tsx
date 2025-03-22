
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { IFile } from "@/types/chat";

interface MessageInputProps {
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  isLoading,
  placeholder = "Напишите сообщение...",
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<IFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if ((message.trim() || files.length > 0) && !isLoading && !disabled) {
      onSendMessage(message, files);
      setMessage("");
      setFiles([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: IFile[] = Array.from(event.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        url: URL.createObjectURL(file),
      }));
      
      setFiles([...files, ...newFiles]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(updatedFiles[index].url);
    
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  return (
    <div className="space-y-2">
      {/* Display selected files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background/50">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-1 text-xs border rounded-full px-2 py-1 bg-background">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 rounded-full" 
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          disabled={isLoading || disabled}
          type="button"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Прикрепить файл</span>
        </Button>
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] resize-none"
          disabled={isLoading || disabled}
        />
        
        <Button 
          className="shrink-0" 
          size="icon" 
          onClick={handleSendMessage}
          disabled={(message.trim() === '' && files.length === 0) || isLoading || disabled}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Отправить</span>
        </Button>
      </div>
    </div>
  );
}
