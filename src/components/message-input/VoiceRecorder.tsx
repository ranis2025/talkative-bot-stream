
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface VoiceRecorderProps {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  isRecording, 
  startRecording, 
  stopRecording 
}) => {
  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      className="h-10 w-10 rounded-full"
    >
      {isRecording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isRecording ? "Остановить запись" : "Записать голосовое сообщение"}
      </span>
    </Button>
  );
};
