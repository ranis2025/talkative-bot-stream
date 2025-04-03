
import { useState, useRef, KeyboardEvent, ChangeEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Plus, X, FileText, Images, File, Paperclip, Mic, Square } from "lucide-react";
import { IFile } from "@/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

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
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
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
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder with the audio stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { 
          type: 'audio/webm',
          lastModified: Date.now()
        });
        
        const audioFileObject: IFile = {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
          file: audioFile,
          url: URL.createObjectURL(audioFile)
        };
        
        setFiles(prev => [...prev, audioFileObject]);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  }, []);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSendDisabled = isLoading || disabled || (!currentMessage.trim() && files.length === 0);

  return (
    <div className="bg-card/50 border rounded-md focus-within:ring-1 focus-within:ring-primary">
      {files.length > 0 && (
        <div className="p-2 border-b flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-secondary/30 p-1 rounded text-xs gap-1"
            >
              {file.type.startsWith("image/") ? (
                <Images className="h-3 w-3" />
              ) : file.type.startsWith("audio/") ? (
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
              "min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 p-3",
              leftIcon && "pl-10"
            )}
            disabled={isLoading || disabled}
          />
        </div>
        <div className="flex items-center px-3 pb-3">
          {isRecording ? (
            <div className="voice-recording mr-2" onClick={stopRecording}>
              <div className="recording-indicator"></div>
              <span>{formatTime(recordingTime)}</span>
              <Square className="h-3 w-3 ml-1" />
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="voice-record-button mr-1"
                onClick={startRecording}
                disabled={isLoading || disabled}
              >
                <Mic className="h-5 w-5" />
              </Button>
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
            </>
          )}
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
