
import { IMessage } from "@/types/chat";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface MessageProps {
  message: IMessage;
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className={`flex flex-col ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`px-4 py-2 rounded-lg max-w-[80%] flex group relative ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {message.bot_name && message.role === "bot" && (
          <div className="font-medium text-xs mb-1 text-muted-foreground">
            {message.bot_name}
          </div>
        )}
        
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
        
        {message.files && message.files.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.files.map((file, index) => (
              <div key={index} className="text-sm">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {file.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
