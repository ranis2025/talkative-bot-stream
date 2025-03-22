
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  isLoading,
  placeholder = "Напишите сообщение...",
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[60px] resize-none"
        disabled={isLoading || disabled}
      />
      <Button 
        className="shrink-0" 
        size="icon" 
        onClick={handleSendMessage}
        disabled={!message.trim() || isLoading || disabled}
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">Отправить</span>
      </Button>
    </div>
  );
}
