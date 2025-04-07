
import React from "react";
import { IMessage } from "@/types/chat";
import { MessageContent } from "./MessageContent";
import { ImageAttachments } from "./ImageAttachments";
import { FileAttachments } from "./FileAttachments";
import { AudioAttachments } from "./AudioAttachments";
import { MessageTimestamp } from "./MessageTimestamp";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractImages, extractFiles, extractAudio } from "@/lib/fileExtractor";

interface MessageProps {
  message: IMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isBot = message.role === "bot";
  const hasImageLinks = isBot && extractImages(message.content).length > 0;
  const hasFileLinks = isBot && extractFiles(message.content).length > 0;
  const hasAudioLinks = isBot && extractAudio(message.content).length > 0;

  return (
    <>
      {/* If bot message has image links, show them in a separate message first */}
      {hasImageLinks && (
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
          
          <ImageAttachments content={message.content} />
          <MessageTimestamp message={message} />
        </div>
      )}
      
      {/* If bot message has file links, show them in a separate message */}
      {hasFileLinks && (
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
          
          <FileAttachments content={message.content} />
          <MessageTimestamp message={message} />
        </div>
      )}
      
      {/* If bot message has audio links, show them as a voice message */}
      {hasAudioLinks ? (
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
          
          <AudioAttachments content={message.content} />
          <MessageTimestamp message={message} />
        </div>
      ) : (
        // Original message (only show if there are no audio links for bot messages)
        !isBot || (isBot && !hasAudioLinks) ? (
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
            
            <MessageContent message={message} />
            <MessageTimestamp message={message} />
          </div>
        ) : null
      )}
    </>
  );
};

export default Message;
