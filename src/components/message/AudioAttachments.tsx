
import React, { useState, useRef } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractAudio } from "@/lib/fileExtractor";

interface AudioAttachmentsProps {
  content?: string;
}

export const AudioAttachments: React.FC<AudioAttachmentsProps> = ({ content }) => {
  const extractedAudioLinks = content ? extractAudio(content) : [];
  const [audioPlaying, setAudioPlaying] = useState<{[key: string]: boolean}>({});
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  
  if (extractedAudioLinks.length === 0) return null;
  
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
    <div className="mt-2 space-y-3">
      <div className="flex items-center gap-1 mb-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Голосовое сообщение:</span>
      </div>
      
      {extractedAudioLinks.map((audioUrl, index) => (
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
  );
};
