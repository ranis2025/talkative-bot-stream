
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface CopyResult {
  success: boolean;
  method?: 'clipboard' | 'execCommand' | 'manual';
  error?: string;
}

export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<CopyResult> => {
    if (!text) {
      return { success: false, error: "Нет текста для копирования" };
    }

    // Reset copied state
    setIsCopied(false);

    // Method 1: Try modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        
        toast({
          title: "Скопировано",
          description: "Текст сообщения скопирован в буфер обмена",
        });
        
        // Reset after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
        
        return { success: true, method: 'clipboard' };
      } catch (error) {
        console.warn("Clipboard API failed:", error);
        // Continue to fallback method
      }
    }

    // Method 2: Try execCommand fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setIsCopied(true);
        
        toast({
          title: "Скопировано",
          description: "Текст сообщения скопирован в буфер обмена",
        });
        
        // Reset after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
        
        return { success: true, method: 'execCommand' };
      }
    } catch (error) {
      console.warn("execCommand failed:", error);
    }

    // Method 3: Manual selection fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '50%';
      textArea.style.top = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.zIndex = '9999';
      textArea.style.padding = '10px';
      textArea.style.border = '2px solid #007bff';
      textArea.style.borderRadius = '4px';
      textArea.readOnly = true;
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      toast({
        title: "Выделите и скопируйте",
        description: "Текст выделен. Нажмите Ctrl+C (или Cmd+C) для копирования",
        duration: 5000,
      });
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(textArea)) {
          document.body.removeChild(textArea);
        }
      }, 5000);
      
      return { success: true, method: 'manual' };
    } catch (error) {
      console.error("All copy methods failed:", error);
      
      // Final fallback - show detailed error
      const isSecure = window.isSecureContext;
      const hasClipboard = !!navigator.clipboard;
      
      let errorMessage = "Не удалось скопировать текст. ";
      if (!isSecure) {
        errorMessage += "Требуется HTTPS для копирования. ";
      }
      if (!hasClipboard) {
        errorMessage += "Clipboard API недоступен. ";
      }
      errorMessage += "Попробуйте выделить текст вручную.";
      
      toast({
        title: "Ошибка копирования",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      return { 
        success: false, 
        error: `Secure context: ${isSecure}, Clipboard API: ${hasClipboard}, Error: ${error}` 
      };
    }
  }, []);

  return {
    copyToClipboard,
    isCopied
  };
};
