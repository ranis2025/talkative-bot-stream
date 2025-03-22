
import { ApiRequest } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export async function sendMessage(chatId: string, message: string, specificBotId?: string | null): Promise<string> {
  try {
    // Get bot ID from URL or use the specified one
    const urlParams = new URLSearchParams(window.location.search);
    const urlBotId = urlParams.get('bot_id');
    const botId = specificBotId || urlBotId;
    
    if (!botId) {
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
      throw new Error(`Edge function error: ${error.message}`);
    }

    // Log the response for debugging
    console.log("Edge function response:", data);

    // Check if the data is in the expected format
    if (!data || typeof data !== 'object') {
      console.error("Invalid response format:", data);
      throw new Error("Received invalid response format from server");
    }

    if (!data.ok) {
      const errorMessage = data.done || "Unknown error";
      console.error("API returned error:", errorMessage);
      throw new Error(errorMessage);
    }

    return data.done;
  } catch (error) {
    console.error("Error sending message:", error);
    
    // Check if error is from EdgeFunction directly
    if (error instanceof Error) {
      const errorMessage = error.message;
      
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
