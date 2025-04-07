
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { IFile } from "@/types/chat";
import { toast } from "@/components/ui/use-toast";

interface VoiceRecorderProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  onRecordingComplete: (file: IFile) => void;
  disabled: boolean;
}

export function VoiceRecorder({ 
  isRecording, 
  setIsRecording, 
  onRecordingComplete,
  disabled 
}: VoiceRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder with proper types
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const file = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(audioBlob);
        
        const newFile: IFile = {
          name: "Голосовое сообщение.webm",
          size: file.size,
          type: file.type,
          file,
          url: audioURL,
        };
        
        onRecordingComplete(newFile);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Ошибка записи",
        description: "Не удалось получить доступ к микрофону",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={isRecording ? "destructive" : "ghost"}
      className="rounded-full"
      onClick={toggleRecording}
      disabled={disabled}
      title={isRecording ? "Остановить запись" : "Записать голосовое сообщение"}
    >
      {isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}

// Add RecordingIndicator as a nested component
VoiceRecorder.RecordingIndicator = function RecordingIndicator() {
  const [recordingTime, setRecordingTime] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      <Mic className="h-4 w-4" />
      <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
    </>
  );
};
