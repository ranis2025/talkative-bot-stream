import { IMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileIcon, ImageIcon, FileTextIcon, CheckCircle, Clock, User, Bot, Images, Link, Play, Pause, Volume2, Copy, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const isBot = message.role === "bot";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: ru });
  const [imageLoaded, setImageLoaded] = useState<{[key: string]: boolean}>({});
  const [extractedImageLinks, setExtractedImageLinks] = useState<string[]>([]);
  const [extractedFileLinks, setExtractedFileLinks] = useState<{url: string, text: string}[]>([]);
  const [extractedAudioLinks, setExtractedAudioLinks] = useState<string[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<{[key: string]: boolean}>({});
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  
  // Function to copy message content to clipboard
  const handleCopyMessage = async () => {
    if (!message.content) return;
    
    const result = await copyToClipboard(message.content);
    
    // Log result for debugging
    console.log("Copy result:", result);
  };
  
  // Function to determine file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileTextIcon className="h-5 w-5" />;
    } else {
      return <FileIcon className="h-5 w-5" />;
    }
  };
  
  // Function to check if a file is an image
  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };
  
  // Handle image load
  const handleImageLoad = (fileUrl: string) => {
    setImageLoaded(prev => ({...prev, [fileUrl]: true}));
  };
  
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
  
  // Extract image, file, and audio links from bot message content
  useEffect(() => {
    if (isBot && message.content) {
      // Regular expression to find image URLs in text
      const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))(\s|$|\)|\]|"|')/gi;
      const matches = [...message.content.matchAll(imgRegex)];
      
      if (matches.length > 0) {
        const links = matches.map(match => match[1]);
        setExtractedImageLinks(links);
      }
      
      // Regular expression to find file URLs in text (excluding image formats)
      // This regex looks for markdown style links [text](url) where url is not an image
      const fileRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+\.(?!png|jpg|jpeg|gif|webp)[a-zA-Z0-9]+)\)/gi;
      const fileMatches = [...message.content.matchAll(fileRegex)];
      
      if (fileMatches.length > 0) {
        const fileLinks = fileMatches.map(match => ({
          text: match[1],
          url: match[2]
        }));
        setExtractedFileLinks(fileLinks);
      }
      
      // Regular expression to find mp3 URLs in text
      const audioRegex = /(https?:\/\/.*\.(?:mp3))(\s|$|\)|\]|"|')/gi;
      const audioMatches = [...message.content.matchAll(audioRegex)];
      
      if (audioMatches.length > 0) {
        const audioLinks = audioMatches.map(match => match[1]);
        setExtractedAudioLinks(audioLinks);
      }
    }
  }, [isBot, message.content]);
  
  return (
    <>
      {/* If bot message has image links, show them in a separate message first */}
      {isBot && extractedImageLinks.length > 0 && (
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
          
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-1 mb-2">
              <Images className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Изображения из ответа:</span>
            </div>
            
            {extractedImageLinks.map((imageUrl, index) => (
              <div key={index} className="relative">
                {!imageLoaded[imageUrl] && (
                  <div className="bg-muted/30 animate-pulse h-40 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <img 
                  src={imageUrl} 
                  alt={`Изображение ${index + 1}`} 
                  className={cn(
                    "w-full rounded-md max-h-80 object-contain bg-black/5", 
                    !imageLoaded[imageUrl] && "hidden"
                  )}
                  onLoad={() => handleImageLoad(imageUrl)}
                />
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-1 mt-2">
            <button
              onClick={handleCopyMessage}
              className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50"
              title="Копировать текст"
            >
              {isCopied ? (
                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
              {formattedTime}
            </div>
          </div>
        </div>
      )}
      
      {/* If bot message has file links, show them in a separate message */}
      {isBot && extractedFileLinks.length > 0 && (
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
          
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-1 mb-2">
              <Link className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Файлы из ответа:</span>
            </div>
            
            {extractedFileLinks.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors">
                <FileIcon className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.text}</div>
                </div>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                >
                  Открыть
                </a>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-1 mt-2">
            <button
              onClick={handleCopyMessage}
              className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50"
              title="Копировать текст"
            >
              {isCopied ? (
                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
              {formattedTime}
            </div>
          </div>
        </div>
      )}
      
      {/* If bot message has audio links, show them as a voice message instead of the original message */}
      {isBot && extractedAudioLinks.length > 0 ? (
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
          
          <div className="flex items-center justify-end gap-1 mt-2">
            <button
              onClick={handleCopyMessage}
              className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50"
              title="Копировать текст"
            >
              {isCopied ? (
                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
              {formattedTime}
            </div>
          </div>
        </div>
      ) : (
        // Original message (only show if there are no audio links for bot messages)
        !isBot || (isBot && extractedAudioLinks.length === 0) ? (
          <div
            className={cn(
              "flex flex-col p-4 rounded-2xl max-w-[80%] shadow-sm transition-all group",
              isBot
                ? "bg-secondary/50 text-secondary-foreground self-start border-l-4 border-primary/30 bot-message"
                : "bg-primary/10 text-foreground self-end border-r-4 border-primary/70 user-message"
            )}
            style={{ float: isBot ? "left" : "right", clear: "both" }}
          >
            <div className="flex items-center gap-2 mb-1">
              {isBot ? (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {message.bot_name && (
                    <div className="text-xs font-medium text-primary flex items-center gap-1">
                      {message.bot_name} 
                      {message.bot_id && <span className="text-muted-foreground text-[10px]">(ID: {message.bot_id})</span>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-xs font-medium">Вы</div>
                </>
              )}
            </div>
            
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Display file attachments if present */}
            {message.files && message.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.files.map((file, index) => (
                  <div key={index} className="rounded-md overflow-hidden">
                    {isImageFile(file.name) ? (
                      <div className="relative">
                        {!imageLoaded[file.url] && (
                          <div className="bg-muted/30 animate-pulse h-40 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className={cn(
                            "w-full rounded-md max-h-80 object-contain bg-black/5", 
                            !imageLoaded[file.url] && "hidden"
                          )}
                          onLoad={() => handleImageLoad(file.url)}
                        />
                        <div className="absolute bottom-2 right-2">
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download={file.name}
                            className="text-xs bg-background/80 backdrop-blur-sm text-foreground py-1 px-2 rounded-md hover:bg-background/90 transition-colors flex items-center gap-1"
                          >
                            Скачать
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors">
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download={file.name}
                          className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                        >
                          Скачать
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-1 mt-2">
              <button
                onClick={handleCopyMessage}
                className="text-xs text-muted-foreground flex items-center mr-2 hover:text-primary transition-colors p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100"
                title="Копировать текст"
              >
                {isCopied ? (
                  <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="text-xs text-muted-foreground flex items-center">
                {isBot ? (
                  <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {formattedTime}
              </div>
            </div>
          </div>
        ) : null
      )}
    </>
  );
}
