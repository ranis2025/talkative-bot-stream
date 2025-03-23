
import { ApiRequest } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast"; 
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

// Function to upload files and return their URLs
export async function uploadFiles(files: File[]): Promise<{ name: string; size: number; type: string; url: string; }[]> {
  try {
    const uploadedFiles = [];
    
    for (const file of files) {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);
        
      if (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);
      
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl
      });
    }
    
    return uploadedFiles;
  } catch (error) {
    console.error("Error in uploadFiles:", error);
    toast({
      title: "Ошибка загрузки файлов",
      description: "Не удалось загрузить файлы. Пожалуйста, попробуйте еще раз.",
      variant: "destructive",
    });
    throw error;
  }
}

export async function sendMessage(chatId: string, message: string, files?: { name: string; size: number; type: string; url: string; file?: File }[], specificBotId?: string | null): Promise<string> {
  try {
    // Get bot ID from URL or use the specified one
    const urlParams = new URLSearchParams(window.location.search);
    const urlBotId = urlParams.get('bot_id');
    const botId = specificBotId || urlBotId;
    
    if (!botId) {
      console.error("No bot ID found in URL or provided as parameter");
      toast({
        title: "Ошибка",
        description: "ID бота не указан. Пожалуйста, проверьте URL или настройки.",
        variant: "destructive",
      });
      throw new Error("Bot ID is required");
    }
    
    console.log(`Sending message to bot: ${botId}, chat: ${chatId}`);
    
    // Create the payload for the API
    const payload: ApiRequest = {
      bot_id: botId,
      chat_id: chatId,
      message: message
    };

    // Call our Supabase Edge Function
    console.log(`Sending payload to edge function:`, payload);
    const { data, error } = await supabase.functions.invoke('chat', {
      body: payload
    });

    if (error) {
      console.error("Error calling chat function:", error);
      
      // Check if it's a network or connection issue
      if (error.message?.includes("Failed to fetch") || 
          error.message?.includes("Network error") ||
          error.message?.includes("timeout")) {
        toast({
          title: "Ошибка сети",
          description: "Проблема с сетевым подключением. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.",
          variant: "destructive",
        });
        return "Проблема с сетевым подключением. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.";
      }
      
      // Check if it's an Edge Function error
      if (error.message?.includes("Edge Function returned a non-2xx status code")) {
        console.error("Edge Function returned an error status. Check the logs in the Supabase dashboard for more details.");
        toast({
          title: "Ошибка сервера",
          description: "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.",
          variant: "destructive",
        });
        return "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.";
      }
      
      toast({
        title: "Ошибка",
        description: error.message || "Неизвестная ошибка",
        variant: "destructive",
      });
      throw new Error(`Edge function error: ${error.message}`);
    }

    // Log the response for debugging
    console.log("Edge function response:", data);

    // Check if the data is in the expected format
    if (!data || typeof data !== 'object') {
      console.error("Invalid response format:", data);
      toast({
        title: "Ошибка формата данных",
        description: "Получен недопустимый формат ответа от сервера",
        variant: "destructive",
      });
      throw new Error("Received invalid response format from server");
    }

    if (!data.ok) {
      const errorMessage = data.done || "Unknown error";
      console.error("API returned error:", errorMessage);
      
      toast({
        title: "Ошибка сервера",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Format specific error messages for the user
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return "Бот не найден. Пожалуйста, проверьте ID бота и попробуйте снова.";
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return "Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.";
      }
      
      if (errorMessage.includes("OpenAI API")) {
        return "Ошибка при обработке запроса AI моделью. Пожалуйста, попробуйте позже.";
      }
      
      if (errorMessage.includes("Pro-Talk API")) {
        return "Ошибка при обработке запроса внешним API. Пожалуйста, попробуйте позже.";
      }
      
      throw new Error(errorMessage);
    }

    if (typeof data.done !== 'string') {
      console.error("Invalid 'done' field format:", data.done);
      toast({
        title: "Ошибка формата данных",
        description: "Ответ сервера в неправильном формате",
        variant: "destructive",
      });
      throw new Error("Ответ сервера в неправильном формате");
    }

    return data.done;
  } catch (error) {
    console.error("Error sending message:", error);
    
    // Check if error is from EdgeFunction directly
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      toast({
        title: "Ошибка",
        description: errorMessage || "Произошла ошибка при обработке запроса",
        variant: "destructive",
      });
      
      // Handle Edge Function non-2xx status code
      if (errorMessage.includes("Edge Function returned a non-2xx status code")) {
        console.error("Edge Function returned a non-2xx status code. This could be due to a server-side issue.");
        return "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.";
      }
      
      // Handle JSON parsing errors
      if (error instanceof SyntaxError && errorMessage.includes("JSON")) {
        console.error("JSON parse error - Got non-JSON response from server");
        return "Сервер вернул неверный формат данных. Возможно, это связано с проблемами сети или настройками сервера.";
      }
      
      // Return a user-friendly error message based on the error
      if (errorMessage.includes("Bot ID is required")) {
        return "Ошибка: ID бота не указан. Пожалуйста, проверьте URL или настройки.";
      }
      
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return "Ошибка: Указанный бот не найден. Пожалуйста, проверьте ID бота.";
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return "Ошибка: Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.";
      }
    }
    
    // Default error message
    return "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.";
  }
}

export async function sendGroupMessage(chatId: string, message: string, botIds: string[], files?: { name: string; size: number; type: string; url: string; }[]): Promise<{botId: string, response: string}[]> {
  try {
    if (!botIds || botIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Не выбраны боты для группового чата.",
        variant: "destructive",
      });
      throw new Error("Bot IDs are required for group chat");
    }
    
    console.log(`Sending group message to bots: ${botIds.join(', ')}, chat: ${chatId}`);
    
    // Send message to each bot in parallel
    const responses = await Promise.all(
      botIds.map(async (botId) => {
        try {
          // Create the payload for the API
          const payload: ApiRequest = {
            bot_id: botId,
            chat_id: chatId,
            message: message
          };
  
          console.log(`Sending payload to bot ${botId}:`, payload);
          const { data, error } = await supabase.functions.invoke('chat', {
            body: payload
          });
  
          if (error) {
            console.error(`Error calling chat function for bot ${botId}:`, error);
            return {
              botId,
              response: `Ошибка при взаимодействии с ботом: ${error.message || "Неизвестная ошибка"}`
            };
          }
  
          if (!data || typeof data !== 'object') {
            console.error(`Invalid response format for bot ${botId}:`, data);
            return {
              botId,
              response: `Получен недопустимый формат ответа от бота ${botId}`
            };
          }
  
          if (!data.ok) {
            const errorMessage = data.done || "Unknown error";
            console.error(`API returned error for bot ${botId}:`, errorMessage);
            return {
              botId,
              response: `Ошибка бота ${botId}: ${errorMessage}`
            };
          }
  
          if (typeof data.done !== 'string') {
            console.error(`Invalid 'done' field format for bot ${botId}:`, data.done);
            return {
              botId,
              response: `Ответ бота ${botId} в неправильном формате`
            };
          }
  
          return {
            botId,
            response: data.done
          };
        } catch (botError) {
          console.error(`Error processing response from bot ${botId}:`, botError);
          return {
            botId,
            response: `Ошибка при обработке ответа от бота ${botId}: ${botError.message || "Неизвестная ошибка"}`
          };
        }
      })
    );
    
    console.log("Group chat responses:", responses);
    return responses;
  } catch (error) {
    console.error("Error sending group message:", error);
    
    toast({
      title: "Ошибка",
      description: error.message || "Произошла ошибка при отправке сообщения",
      variant: "destructive",
    });
    
    throw error;
  }
}
