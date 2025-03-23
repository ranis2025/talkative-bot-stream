
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Bot, Info, Mic, StopCircle } from "lucide-react";
import { IFile } from "@/types/chat";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSendMessage: (message: string, files?: IFile[]) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  activeBotsCount?: number;
}

export function MessageInput({
  onSendMessage,
  isLoading,
  placeholder = "Напишите сообщение...",
  disabled = false,
  activeBotsCount = 0
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<IFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<IFile | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if ((message.trim() || files.length > 0 || audioFile) && !isLoading && !disabled) {
      const allFiles = audioFile ? [...files, audioFile] : files;
      onSendMessage(message, allFiles);
      setMessage("");
      setFiles([]);
      setAudioFile(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      try {
        const newFiles: IFile[] = [];
        
        for (const file of Array.from(event.target.files)) {
          // Create a form data object to upload the file
          const formData = new FormData();
          formData.append('file', file);
          
          // Upload to tmpfiles.org API
          const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to upload file: ${file.name}`);
          }
          
          const result = await response.json();
          
          // Convert the tmpfiles URL to its download format
          // Example: "https://tmpfiles.org/1234" -> "https://tmpfiles.org/dl/1234/filename.ext"
          const uploadUrl = result.data.url;
          const fileId = uploadUrl.split('/').pop();
          const downloadUrl = `https://tmpfiles.org/dl/${fileId}/${file.name}`;
          
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadUrl
          });
        }
        
        setFiles([...files, ...newFiles]);
        toast({
          title: "Файлы загружены",
          description: `${newFiles.length} файл(ов) успешно загружено`,
        });
      } catch (error) {
        console.error("Error uploading files:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить файлы. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        
        try {
          // Create a form data object to upload the file
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio-message.mp3');
          
          // Upload to tmpfiles.org API
          const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload audio');
          }
          
          const result = await response.json();
          
          // Convert the tmpfiles URL to its download format
          const uploadUrl = result.data.url;
          const fileId = uploadUrl.split('/').pop();
          const downloadUrl = `https://tmpfiles.org/dl/${fileId}/audio-message.mp3`;
          
          setAudioFile({
            name: 'Голосовое сообщение.mp3',
            size: audioBlob.size,
            type: 'audio/mp3',
            url: downloadUrl
          });
          
          toast({
            title: "Аудио записано",
            description: "Голосовое сообщение готово к отправке",
          });
        } catch (error) {
          console.error("Error uploading audio:", error);
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить аудио. Пожалуйста, попробуйте снова.",
            variant: "destructive",
          });
        }
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Ошибка доступа к микрофону",
        description: "Убедитесь, что вы предоставили доступ к микрофону.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
  };

  return <div className="space-y-2">
      {/* Display selected files */}
      {files.length > 0 && <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background/50">
          {files.map((file, index) => <div key={index} className="flex items-center gap-1 text-xs border rounded-full px-2 py-1 bg-background">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeFile(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>)}
        </div>}
      
      {/* Display recorded audio */}
      {audioFile && !isRecording && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background/50">
          <audio src={audioFile.url} controls className="h-8 max-w-[250px]" />
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={removeAudio}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
        
        {!isRecording ? (
          <>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon" disabled={isLoading || disabled} type="button" className="rounded-full shrink-0 text-center mx-0 text-xl">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Прикрепить файл</span>
            </Button>
            
            <Button 
              onClick={startRecording} 
              variant="outline" 
              size="icon" 
              disabled={isLoading || disabled || audioFile !== null} 
              type="button" 
              className="rounded-full shrink-0 text-center mx-0 text-xl"
            >
              <Mic className="h-5 w-5" />
              <span className="sr-only">Записать голосовое сообщение</span>
            </Button>
          </>
        ) : (
          <Button 
            onClick={stopRecording} 
            variant="destructive" 
            size="sm"
            className="rounded-full shrink-0 flex items-center gap-2 animate-pulse"
          >
            <StopCircle className="h-4 w-4" />
            <span>{formatTime(recordingTime)}</span>
          </Button>
        )}
        
        {activeBotsCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center px-2 py-1 rounded-full bg-primary/10 text-xs text-primary border border-primary/20">
                  <Bot className="h-3 w-3 mr-1" />
                  <span>{activeBotsCount} {activeBotsCount === 1 ? 'бот' : 
                         (activeBotsCount > 1 && activeBotsCount < 5) ? 'бота' : 'ботов'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>В этом чате активно {activeBotsCount} {activeBotsCount === 1 ? 'бот' : 
                   (activeBotsCount > 1 && activeBotsCount < 5) ? 'бота' : 'ботов'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <Textarea 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          onKeyDown={handleKeyDown} 
          placeholder={isRecording ? "Запись голосового сообщения..." : placeholder} 
          className="min-h-[60px] resize-none" 
          disabled={isLoading || disabled || isRecording} 
        />
        
        <Button 
          className="shrink-0" 
          size="icon" 
          onClick={handleSendMessage} 
          disabled={(message.trim() === '' && files.length === 0 && !audioFile) || isLoading || disabled || isRecording}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Отправить</span>
        </Button>
      </div>
    </div>;
}
