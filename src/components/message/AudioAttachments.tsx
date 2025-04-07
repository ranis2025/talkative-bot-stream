
import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, CheckCheck, Copy, Pause, Play, Volume2 } from "lucide-react";
import { useState, useRef } from "react";
import { MessageTimestamp } from "./MessageTimestamp";

interface AudioAttachmentsProps {
  message: IMessage;
  audioLinks: string[];
  formattedTime: string;
  onCopy: () => void;
  isCopied: boolean;
}

export function AudioAttachments({ 
  message, 
  audioLinks, 
  formattedTime, 
  onCopy, 
  isCopied 
}: AudioAttachmentsProps) {
  const [audioPlaying, setAudioPlaying] = useState<{[key: string]: boolean}>({});
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  
  // Toggle audio playback
  const toggleAudio = (audioUrl: string) => {
    const audioElement = audioRefs.current[audioUrl];
    
    if (!audioElement) return;
    
    if (audioPlaying[audioUrl]) {
      audioElement.pause();
      setAudioPlaying(prev => ({...prev, [audioUrl]: false}));
    } else {
      // Pause all other playing audio
      Object.entries(audioRefs.current).forEach(([url, element]) => {
        if (url !== audioUrl && element && !element.paused) {
          element.pause();
          setAudioPlaying(prev => ({...prev, [url]: false}));
        }
      });
      
      audioElement.play().catch(error => {
        console.error("Audio playback error:", error);
      });
      setAudioPlaying(prev => ({...prev, [audioUrl]: true}));
    }
  };
  
  // Handle audio ended event
  const handleAudioEnded = (audioUrl: string) => {
    setAudioPlaying(prev => ({...prev, [audioUrl]: false}));
  };
  
  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-2xl max-w-[80%] shadow-sm transition-all",
        "bg-secondary/50 text-secondary-foreground self-start border-l-4 border-primary/30 bot-message"
      )}
      style={{ float: "left", clear: "both" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        {message.bot_name && (
          <div className="text-xs font-medium text-primary flex items-center gap-1">
            {message.bot_name} 
            {message.bot_id && <span className="text-muted-foreground text-[10px]">(ID: {message.bot_id})</span>}
          </div>
        )}
      </div>
      
      <div className="mt-2 space-y-3">
        <div className="flex items-center gap-1 mb-2">
          <Volume2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Голосовое сообщение:</span>
        </div>
        
        {audioLinks.map((audioUrl, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-md border bg-background/50">
            <button
              onClick={() => toggleAudio(audioUrl)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                audioPlaying[audioUrl] ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
              )}
            >
              {audioPlaying[audioUrl] ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
            
            <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded overflow-hidden">
              <audio 
                ref={(el) => (audioRefs.current[audioUrl] = el)}
                src={audioUrl}
                onEnded={() => handleAudioEnded(audioUrl)}
                onTimeUpdate={(e) => {
                  const target = e.target as HTMLAudioElement;
                  const progress = target.currentTime / target.duration;
                  const progressBar = target.parentElement?.previousElementSibling?.nextElementSibling?.firstElementChild as HTMLElement;
                  if (progressBar) {
                    progressBar.style.width = `${progress * 100}%`;
                  }
                }}
                style={{ display: 'none' }}
              />
              <div className="h-full bg-primary rounded transition-all duration-200" style={{ width: '0%' }}></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end gap-1 mt-2">
        <button
          onClick={onCopy}
          className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50"
          title="Копировать текст"
        >
          {isCopied ? (
            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <MessageTimestamp isBot={true} formattedTime={formattedTime} />
      </div>
    </div>
  );
}
