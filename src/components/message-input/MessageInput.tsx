
import { useState, useRef, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";
import { IFile } from "@/types/chat";
import { ReactNode } from "react";
import { FileAttachments } from "./FileAttachments";
import { FileInputButton } from "./FileInputButton";
import { VoiceRecorder } from "./VoiceRecorder";

interface MessageInputProps {
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  activeBotsCount?: number;
  value?: string;
  onChange?: (value: string) => void;
  leftIcon?: ReactNode;
}

export function MessageInput({ 
  onSendMessage, 
  isLoading = false, 
  placeholder = "Напишите сообщение...",
  disabled = false,
  activeBotsCount = 0,
  value,
  onChange,
  leftIcon
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<IFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const currentMessage = value !== undefined ? value : message;
  
  const handleSend = () => {
    if (isLoading || disabled || (!currentMessage.trim() && files.length === 0)) return;
    
    onSendMessage(currentMessage.trim(), files.length > 0 ? files : undefined);
    
    if (value === undefined) {
      setMessage("");
    }
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setMessage(newValue);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        url: URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileInput = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };
  
  const addAudioFile = (file: IFile) => {
    setFiles(prev => [...prev, file]);
  };

  const isSendDisabled = isLoading || disabled || (!currentMessage.trim() && files.length === 0);

  return (
    <div className="bg-card/50 border rounded-md focus-within:ring-1 focus-within:ring-primary">
      {files.length > 0 && (
        <FileAttachments files={files} onRemoveFile={removeFile} />
      )}
      <div className="flex items-end">
        <div className="flex-1 relative">
          {leftIcon && (
            <div className="absolute left-3 top-3">
              {leftIcon}
            </div>
          )}
          <Textarea
            placeholder={isRecording ? "Запись голосового сообщения..." : placeholder}
            value={currentMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 p-3 focus:outline-none",
              leftIcon && "pl-10"
            )}
            disabled={isLoading || disabled || isRecording}
          />
          {isRecording && (
            <div className="absolute bottom-3 left-3 text-red-500 flex items-center gap-2 animate-pulse">
              <VoiceRecorder.RecordingIndicator />
            </div>
          )}
        </div>
        <div className="flex items-center px-3 pb-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          
          <VoiceRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onRecordingComplete={addAudioFile}
            disabled={isLoading || disabled}
          />
          
          <FileInputButton 
            openFileInput={openFileInput} 
            disabled={isLoading || disabled || isRecording} 
          />
          
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isSendDisabled}
            className={cn("rounded-full ml-1", 
              isSendDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
