
import { useState, useRef, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Plus, X, FileText, Images, File, Paperclip, Mic, MicOff } from "lucide-react";
import { IFile } from "@/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

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
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const audioFile: IFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          url: URL.createObjectURL(file),
        };
        
        setFiles((prev) => [...prev, audioFile]);
        setIsRecording(false);
        setRecordingTime(0);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить доступ к микрофону",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const isSendDisabled = isLoading || disabled || (!currentMessage.trim() && files.length === 0);

  return (
    <div className="bg-card/50 border rounded-md focus-within:ring-1 focus-within:ring-primary shadow-none">
      {files.length > 0 && (
        <div className="p-2 border-b flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-secondary/30 p-1 rounded text-xs gap-1"
            >
              {file.type.startsWith("image/") ? (
                <Images className="h-3 w-3" />
              ) : file.type.includes("audio") ? (
                <Mic className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              <span className="truncate max-w-[100px]">{file.name}</span>
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
      <div className="flex items-end">
        <div className="flex-1 relative">
          {leftIcon && (
            <div className="absolute left-3 top-3">
              {leftIcon}
            </div>
          )}
          <Textarea
            placeholder={placeholder}
            value={currentMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 p-3 shadow-none",
              leftIcon && "pl-10"
            )}
            disabled={isLoading || disabled}
          />
        </div>
        <div className="flex items-center px-3 pb-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          
          {isRecording ? (
            <div className="flex items-center mr-2">
              <span className="text-xs text-red-500 mr-2 animate-pulse">{formatRecordingTime(recordingTime)}</span>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="rounded-full"
                onClick={stopRecording}
              >
                <MicOff className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full mr-1"
              onClick={startRecording}
              disabled={isLoading || disabled}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
                disabled={isLoading || disabled}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openFileInput("image/*")}>
                <Images className="h-4 w-4 mr-2" />
                <span>Изображение</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFileInput(".pdf,.doc,.docx,.txt")}>
                <File className="h-4 w-4 mr-2" />
                <span>Документ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFileInput("*")}>
                <Paperclip className="h-4 w-4 mr-2" />
                <span>Любой файл</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isSendDisabled}
            className={cn("rounded-full ml-1", 
              isSendDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
