
import { ApiRequest, IMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { invokeEdgeFunction, queryWithRetry } from "./supabaseRetry";

export async function uploadFiles(files: File[]): Promise<{ name: string; size: number; type: string; url: string; }[]> {
  try {
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;
      
      // Используем retry для загрузки файлов
      const result = await queryWithRetry(async () => {
        return await supabase.storage
          .from('chat-files')
          .upload(filePath, file);
      });
      
      if (result.error) {
        console.error("Error uploading file:", result.error);
        throw result.error;
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

export async function sendMessage(chatId: string, message: string, files?: { name: string; size: number; type: string; url: string; file?: File }[], specificBotId?: string | null): Promise<string> {
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
    
    // Используем новую retry логику для Edge функций
    const data = await invokeEdgeFunction('chat', payload);

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
      
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return "Бот не найден. Пожалуйста, проверьте ID бота и попробуйте снова.";
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return "Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.";
      }
      
      if (errorMessage.includes("OpenAI API")) {
        return "Ошибка при обработке запроса AI моделью. Пожалуйта, попробуйте позже.";
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
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Не показываем toast для retry ошибок - они уже обрабатываются в retry логике
      if (!errorMessage.includes('timeout') && !errorMessage.includes('network')) {
        toast({
          title: "Ошибка",
          description: errorMessage || "Произошла ошибка при обработке запроса",
          variant: "destructive",
        });
      }
      
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
    
    return "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.";
  }
}

export async function sendGroupMessage(chatId: string, message: string, botIds: string[], files?: { name: string; size: number; type: string; url: string; }[], specificBotId?: string | null): Promise<{botId: string, response: string, botName: string}[]> {
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
    
    // Используем retry для получения истории чата
    const chatResult = await queryWithRetry(async () => {
      return await supabase
        .from("protalk_chats")
        .select("*")
        .eq("id", chatId)
        .single();
    });
    
    if (chatResult.error) {
      console.error("Error fetching chat history:", chatResult.error);
      throw new Error(`Error fetching chat history: ${chatResult.error.message}`);
    }
    
    const chatHistory = chatResult.data.messages || [];
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
    
    // Используем retry для получения данных ботов
    const botsResult = await queryWithRetry(async () => {
      return await supabase
        .from("chat_bots")
        .select("*")
        .in("bot_id", botIds);
    });
    
    if (botsResult.error) {
      console.error("Error fetching bots data:", botsResult.error);
      throw new Error(`Error fetching bots data: ${botsResult.error.message}`);
    }
    
    const botsMap = new Map();
    botsResult.data.forEach(bot => {
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
        
        // Используем retry для каждого бота
        const data = await invokeEdgeFunction('chat', payload);
  
        if (!data || typeof data !== 'object') {
          console.error(`Invalid response format for bot ${botId}:`, data);
          responses.push({
            botId,
            response: `Получен недопустимый формат ответа от бота ${botId}`,
            botName: botsMap.get(botId) || "Бот"
          });
          continue;
        }
  
        if (!data.ok) {
          const errorMessage = data.done || "Unknown error";
          console.error(`API returned error for bot ${botId}:`, errorMessage);
          responses.push({
            botId,
            response: `Ошибка бота ${botId}: ${errorMessage}`,
            botName: botsMap.get(botId) || "Бот"
          });
          continue;
        }
  
        if (typeof data.done !== 'string') {
          console.error(`Invalid 'done' field format for bot ${botId}:`, data.done);
          responses.push({
            botId,
            response: `Ответ бота ${botId} в неправильном формате`,
            botName: botsMap.get(botId) || "Бот"
          });
          continue;
        }
  
        responses.push({
          botId,
          response: data.done,
          botName: botsMap.get(botId) || "Бот"
        });
        
        const lastResponse = responses[responses.length - 1];
        messageContent = `${conversationHistoryText}${message}\n\n${lastResponse.botName}: ${lastResponse.response}`;
      } catch (botError) {
        console.error(`Error processing response from bot ${botId}:`, botError);
        responses.push({
          botId,
          response: `Ошибка при обработке ответа от бота ${botId}: ${botError.message || "Неизвестная ошибка"}`,
          botName: botsMap.get(botId) || "Бот"
        });
      }
    }
    
    console.log("Group chat responses:", responses);
    return responses;
  } catch (error) {
    console.error("Error sending group message:", error);
    
    // Не показываем toast для retry ошибок
    if (!error.message?.includes('timeout') && !error.message?.includes('network')) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при отправке сообщения",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}
