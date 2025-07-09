import { ApiRequest, IMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast"; 
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export async function uploadFiles(files: File[]): Promise<{ name: string; size: number; type: string; url: string; }[]> {
  try {
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);
        
      if (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
      
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

export async function sendMessage(chatId: string, message: string, files?: { name: string; size: number; type: string; url: string; file?: File }[], specificBotId?: string | null): Promise<{response: string, serverLogs?: string}> {
  try {
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
    
    let messageContent = message;
    if (files && files.length > 0) {
      if (messageContent && messageContent.trim() !== '') {
        messageContent += '\n\n';
      }
      
      const fileUrls = files.map(file => file.url).join('\n');
      messageContent += fileUrls;
    }
    
    console.log(`Prepared message content with files:`, messageContent);
    
    const payload: ApiRequest = {
      bot_id: botId,
      chat_id: chatId,
      message: messageContent
    };

    console.log(`Sending payload to edge function:`, payload);
    console.log(`Supabase client initialized`);
    console.log(`Attempting to call chat edge function...`);
    
    const { data, error } = await supabase.functions.invoke('chat', {
      body: payload
    });

    console.log(`Edge function response:`, { data, error });

    if (error) {
      console.error("Error calling chat function:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack
      });
      
      // More specific error handling
      if (error.message?.includes("Failed to send a request to the Edge Function") ||
          error.message?.includes("Failed to fetch") || 
          error.message?.includes("Network error") ||
          error.message?.includes("timeout") ||
          error.message?.includes("NetworkError")) {
        console.error("Network connectivity issue detected");
        toast({
          title: "Ошибка сети",
          description: "Проблема с сетевым подключением. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.",
          variant: "destructive",
        });
        const errorLogs = JSON.stringify({
          timestamp: new Date().toISOString(),
          error: "Network connectivity issue",
          details: error.message
        });
        return { response: "Проблема с сетевым подключением. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.", serverLogs: errorLogs };
      }
      
      if (error.message?.includes("Edge Function returned a non-2xx status code")) {
        console.error("Edge Function returned an error status. Check the logs in the Supabase dashboard for more details.");
        toast({
          title: "Ошибка сервера",
          description: "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.",
          variant: "destructive",
        });
        const errorLogs = JSON.stringify({
          timestamp: new Date().toISOString(),
          error: "Edge Function non-2xx status",
          details: error.message
        });
        return { response: "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.", serverLogs: errorLogs };
      }
      
      // For debugging - don't show this error to user, log it and return a generic message
      console.error("Unhandled edge function error:", error);
      toast({
        title: "Ошибка",
        description: "Временная проблема с сервером. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
      const errorLogs = JSON.stringify({
        timestamp: new Date().toISOString(),
        error: "Unhandled edge function error",
        details: error.message
      });
      return { response: "Временная проблема с сервером. Пожалуйста, попробуйте позже.", serverLogs: errorLogs };
    }

    console.log("Edge function response:", data);

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
      
      const errorLogs = JSON.stringify({
        timestamp: new Date().toISOString(),
        error: "API returned error",
        details: errorMessage
      });
      
      toast({
        title: "Ошибка сервера",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return { response: "Бот не найден. Пожалуйста, проверьте ID бота и попробуйте снова.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return { response: "Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("OpenAI API")) {
        return { response: "Ошибка при обработке запроса AI моделью. Пожалуйста, попробуйте позже.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("Pro-Talk API")) {
        return { response: "Ошибка при обработке запроса внешним API. Пожалуйста, попробуйте позже.", serverLogs: errorLogs };
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

    return { response: data.done, serverLogs: data.server_logs };
  } catch (error) {
    console.error("Error sending message:", error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      toast({
        title: "Ошибка",
        description: errorMessage || "Произошла ошибка при обраб��тке запроса",
        variant: "destructive",
      });
      
      const errorLogs = JSON.stringify({
        timestamp: new Date().toISOString(),
        error: "Catch block error",
        details: errorMessage
      });
      
      if (errorMessage.includes("Edge Function returned a non-2xx status code")) {
        console.error("Edge Function returned a non-2xx status code. This could be due to a server-side issue.");
        return { response: "Сервер временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.", serverLogs: errorLogs };
      }
      
      if (error instanceof SyntaxError && errorMessage.includes("JSON")) {
        console.error("JSON parse error - Got non-JSON response from server");
        return { response: "Сервер вернул неверный формат данных. Возможно, это связано с проблемами сети или настройками сервера.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("Bot ID is required")) {
        return { response: "Ошибка: ID бота не указан. Пожалуйста, проверьте URL или настройки.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return { response: "Ошибка: Указанный бот не найден. Пожалуйста, проверьте ID бота.", serverLogs: errorLogs };
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return { response: "Ошибка: Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.", serverLogs: errorLogs };
      }
    }
    
    const errorLogs = JSON.stringify({
      timestamp: new Date().toISOString(),
      error: "Generic error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
    return { response: "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.", serverLogs: errorLogs };
  }
}

export async function sendGroupMessage(chatId: string, message: string, botIds: string[], files?: { name: string; size: number; type: string; url: string; }[], specificBotId?: string | null): Promise<{botId: string, response: string, botName: string, serverLogs?: string}[]> {
  try {
    if (!botIds || botIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Не выбраны боты для группового чата.",
        variant: "destructive",
      });
      throw new Error("Bot IDs are required for group chat");
    }
    
    console.log(`Sending group message to bots: ${botIds.join(', ')}, chat: ${chatId}, specific bot: ${specificBotId || 'none'}`);
    
    const { data: chatData, error: chatError } = await supabase
      .from("protalk_chats")
      .select("*")
      .eq("id", chatId)
      .single();
    
    if (chatError) {
      console.error("Error fetching chat history:", chatError);
      throw new Error(`Error fetching chat history: ${chatError.message}`);
    }
    
    const chatHistory = chatData.messages || [];
    const recentHistory = Array.isArray(chatHistory) ? chatHistory.slice(-20) : [];
    
    let conversationHistoryText = "";
    if (recentHistory.length > 0) {
      conversationHistoryText = "История переписки:\n\n";
      
      recentHistory.forEach((msgJson) => {
        const msg = msgJson as unknown as IMessage;
        
        if (typeof msg === 'object' && msg !== null) {
          if (msg.role === "user") {
            conversationHistoryText += `Пользователь: ${msg.content}\n\n`;
          } else if (msg.role === "bot") {
            const botName = msg.bot_name || "Бот";
            conversationHistoryText += `${botName}: ${msg.content}\n\n`;
          }
        }
      });
      
      conversationHistoryText += "Текущий вопрос:\n\n";
    }
    
    let messageContent = conversationHistoryText + message;
    if (files && files.length > 0) {
      if (messageContent && messageContent.trim() !== '') {
        messageContent += '\n\n';
      }
      
      const fileUrls = files.map(file => file.url).join('\n');
      messageContent += fileUrls;
    }
    
    const { data: botsData, error: botsError } = await supabase
      .from("chat_bots")
      .select("*")
      .in("bot_id", botIds);
    
    if (botsError) {
      console.error("Error fetching bots data:", botsError);
      throw new Error(`Error fetching bots data: ${botsError.message}`);
    }
    
    const botsMap = new Map();
    botsData.forEach(bot => {
      botsMap.set(bot.bot_id, bot.name);
    });
    
    let orderedBotIds = [...botIds];
    if (specificBotId && botIds.includes(specificBotId)) {
      orderedBotIds = orderedBotIds.filter(id => id !== specificBotId);
      orderedBotIds.unshift(specificBotId);
    }
    
    const responses = [];
    
    for (const botId of orderedBotIds) {
      try {
        const payload: ApiRequest = {
          bot_id: botId,
          chat_id: chatId,
          message: messageContent
        };
  
        console.log(`Sending payload to bot ${botId}:`, payload);
        const { data, error } = await supabase.functions.invoke('chat', {
          body: payload
        });
  
        if (error) {
          console.error(`Error calling chat function for bot ${botId}:`, error);
          const errorLogs = JSON.stringify({
            timestamp: new Date().toISOString(),
            botId,
            error: "Chat function error",
            details: error.message
          });
          responses.push({
            botId,
            response: `Ошибка при взаимодействии с ботом: ${error.message || "Неизвестная ошибка"}`,
            botName: botsMap.get(botId) || "Бот",
            serverLogs: errorLogs
          });
          continue;
        }
  
        if (!data || typeof data !== 'object') {
          console.error(`Invalid response format for bot ${botId}:`, data);
          const errorLogs = JSON.stringify({
            timestamp: new Date().toISOString(),
            botId,
            error: "Invalid response format",
            details: "Received non-object response"
          });
          responses.push({
            botId,
            response: `Получен недопустимый формат ответа от бота ${botId}`,
            botName: botsMap.get(botId) || "Бот",
            serverLogs: errorLogs
          });
          continue;
        }
  
        if (!data.ok) {
          const errorMessage = data.done || "Unknown error";
          console.error(`API returned error for bot ${botId}:`, errorMessage);
          const errorLogs = JSON.stringify({
            timestamp: new Date().toISOString(),
            botId,
            error: "API returned error",
            details: errorMessage
          });
          responses.push({
            botId,
            response: `Ошибка бота ${botId}: ${errorMessage}`,
            botName: botsMap.get(botId) || "Бот",
            serverLogs: errorLogs
          });
          continue;
        }
  
        if (typeof data.done !== 'string') {
          console.error(`Invalid 'done' field format for bot ${botId}:`, data.done);
          const errorLogs = JSON.stringify({
            timestamp: new Date().toISOString(),
            botId,
            error: "Invalid done field format",
            details: "Done field is not a string"
          });
          responses.push({
            botId,
            response: `Ответ бота ${botId} в неправильном формате`,
            botName: botsMap.get(botId) || "Бот",
            serverLogs: errorLogs
          });
          continue;
        }
  
        responses.push({
          botId,
          response: data.done,
          botName: botsMap.get(botId) || "Бот",
          serverLogs: data.server_logs
        });
        
        const lastResponse = responses[responses.length - 1];
        messageContent = `${conversationHistoryText}${message}\n\n${lastResponse.botName}: ${lastResponse.response}`;
      } catch (botError) {
        console.error(`Error processing response from bot ${botId}:`, botError);
        const errorLogs = JSON.stringify({
          timestamp: new Date().toISOString(),
          botId,
          error: "Bot processing error",
          details: botError.message
        });
        responses.push({
          botId,
          response: `Ошибка при обработке ответа от бота ${botId}: ${botError.message || "Неизвестная ошибка"}`,
          botName: botsMap.get(botId) || "Бот",
          serverLogs: errorLogs
        });
      }
    }
    
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
