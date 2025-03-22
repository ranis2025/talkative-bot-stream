
import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  // Автоматическая регулировка высоты текстового поля
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  }, [message]);

  // Обработка нажатия Enter (без Shift) для отправки
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mt-auto">
      <div className="w-full glass-effect border rounded-xl p-2 flex items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-transparent"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="ml-2 shrink-0"
          disabled={!message.trim() || isLoading}
        >
          <SendIcon className="h-5 w-5" />
          <span className="sr-only">Отправить</span>
        </Button>
      </div>
    </form>
  );
}
