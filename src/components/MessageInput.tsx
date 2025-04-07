import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Paperclip,
  SendHorizonal,
  Mic,
  Square,
  CornerUpLeft,
} from "lucide-react";
import { IFile } from "@/types/chat";
import { FileAttachments } from "./message-input/FileAttachments";
import { FileInputButton } from "./message-input/FileInputButton";
import { VoiceRecorder } from "./message-input/VoiceRecorder";

interface MessageInputProps {
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading: boolean;
  canSend?: boolean;
  botId?: string;
  isGroupChat?: boolean;
  placeholder?: string;
  disabled?: boolean;
  activeBotsCount?: number;
  value?: string;
  onChange?: (value: string) => void;
  leftIcon?: React.ReactNode;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  canSend = true,
  botId,
  isGroupChat = false,
  placeholder = "Введите сообщение...",
  disabled,
  activeBotsCount,
  value,
  onChange,
  leftIcon
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<IFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage.length > 0 || files.length > 0) && !isLoading) {
      onSendMessage(trimmedMessage, files.length > 0 ? files : undefined);
      setMessage("");
      setFiles([]);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: IFile[] = Array.from(event.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file: file
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileIndex: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      if (updatedFiles[fileIndex].url) {
        URL.revokeObjectURL(updatedFiles[fileIndex].url);
      }
      updatedFiles.splice(fileIndex, 1);
      return updatedFiles;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
        const audioFile: IFile = {
          name: `Audio-${new Date().toISOString()}.webm`,
          size: audioBlob.size,
          type: audioBlob.type,
          url: URL.createObjectURL(audioBlob),
          file: new File([audioBlob], `Audio-${new Date().toISOString()}.webm`, {
            type: "audio/webm",
          }),
        };
        setFiles((prev) => [...prev, audioFile]);
        setRecordedChunks([]);
      });

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <FileAttachments files={files} removeFile={removeFile} />
      
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            className="resize-none pr-12 min-h-[80px]"
            value={value !== undefined ? value : message}
            onChange={(e) => {
              const newValue = e.target.value;
              if (onChange) {
                onChange(newValue);
              } else {
                setMessage(newValue);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
          />
          <div className="absolute right-3 bottom-3">
            {!isRecording ? (
              <FileInputButton 
                fileInputRef={fileInputRef} 
                handleFileChange={handleFileChange} 
              />
            ) : null}
          </div>
        </div>
        
        <VoiceRecorder
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />
        
        <Button
          type="submit"
          size="icon"
          disabled={
            (message.trim().length === 0 && files.length === 0) ||
            isLoading ||
            !canSend ||
            disabled
          }
          onClick={handleSendMessage}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">Отправить</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
