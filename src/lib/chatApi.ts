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

// Helper function to check if bot uses ProTalk API (has bot_token)
async function isBotProTalkAPI(botId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('chat_bots')
      .select('bot_token, openai_key')
      .eq('bot_id', botId)
      .single();
    
    if (error || !data) {
      console.error("Error checking bot type:", error);
      return false;
    }
    
    return !!data.bot_token && !data.openai_key;
  } catch (error) {
    console.error("Error checking bot type:", error);
    return false;
  }
}

// Helper function to poll for ProTalk API reply
async function pollForReply(replyId: string, botId: string, maxAttempts: number = 60): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for reply ID: ${replyId}`);
      
      const { data, error } = await supabase.functions.invoke('get-reply', {
        body: { reply_id: replyId, bot_id: botId }
      });
      
      if (error) {
        console.error("Error polling for reply:", error);
        throw new Error(`Polling error: ${error.message}`);
      }
      
      if (data?.ok && data?.ready && data?.message) {
        console.log("Reply received successfully!");
        return data.message;
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error(`Polling attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Wait 5 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error("Timeout waiting for bot response");
}

export async function sendMessage(chatId: string, message: string, files?: { name: string; size: number; type: string; url: string; file?: File }[], specificBotId?: string | null): Promise<string> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlBotId = urlParams.get('bot_id');
    const botId = specificBotId || urlBotId;
    
    if (!botId) {
      console.error("No bot ID found in URL or provided as parameter");
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
    
    // Check if this bot uses ProTalk API
    const isProTalkBot = await isBotProTalkAPI(botId);
    
    if (isProTalkBot) {
      // Use asynchronous ProTalk API approach
      console.log("Using asynchronous ProTalk API approach");
      
      // Step 1: Send message and get reply ID
      const sendPayload = {
        bot_id: botId,
        chat_id: chatId,
        message: messageContent
      };

      console.log(`Sending message payload:`, sendPayload);
      const { data: sendData, error: sendError } = await supabase.functions.invoke('send-message', {
        body: sendPayload
      });

      if (sendError) {
        console.error("Error sending message:", sendError);
        throw new Error(`Failed to send message: ${sendError.message}`);
      }

      if (!sendData?.ok || !sendData?.reply_id) {
        console.error("Invalid send response:", sendData);
        throw new Error("Failed to send message - invalid response");
      }

      console.log(`Message sent, reply ID: ${sendData.reply_id}`);
      
      // Step 2: Poll for reply
      try {
        const reply = await pollForReply(sendData.reply_id, botId);
        return reply;
      } catch (pollError) {
        console.error("Error polling for reply:", pollError);
        return "Не удалось получить ответ от бота в установленное время. Попробуйте позже.";
      }
    } else {
      // Use traditional synchronous approach for OpenAI bots
      console.log("Using synchronous approach for OpenAI bot");
      
      const payload: ApiRequest = {
        bot_id: botId,
        chat_id: chatId,
        message: messageContent
      };

      console.log(`Sending payload to chat function:`, payload);
      const { data, error } = await supabase.functions.invoke('chat', {
        body: payload
      });

      if (error) {
        console.error("Error calling chat function:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log("Chat function response:", data);

      if (!data || typeof data !== 'object') {
        console.error("Invalid response format:", data);
        throw new Error("Received invalid response format from server");
      }

      if (!data.ok) {
        const errorMessage = data.done || "Unknown error";
        console.error("API returned error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (typeof data.done !== 'string') {
        console.error("Invalid 'done' field format:", data.done);
        throw new Error("Response format error");
      }

      return data.done;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes("Bot ID is required")) {
        return "Ошибка: ID бота не указан. Пожалуйста, проверьте URL или настройки.";
      }
      
      if (errorMessage.includes("Bot not found") || errorMessage.includes("Bot with ID")) {
        return "Ошибка: Указанный бот не найден. Пожалуйста, проверьте ID бота.";
      }
      
      if (errorMessage.includes("Bot is not properly configured")) {
        return "Ошибка: Бот не настроен должным образом. Пожалуйста, обратитесь к администратору.";
      }
      
      if (errorMessage.includes("Timeout waiting for bot response")) {
        return "Время ожидания ответа от бота истекло. Попробуйте позже.";
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
        // Check if this bot uses ProTalk API for group messages too
        const isProTalkBot = await isBotProTalkAPI(botId);
        let response: string;
        
        if (isProTalkBot) {
          // Use asynchronous approach for ProTalk bots
          const sendPayload = {
            bot_id: botId,
            chat_id: chatId,
            message: messageContent
          };

          const { data: sendData, error: sendError } = await supabase.functions.invoke('send-message', {
            body: sendPayload
          });

          if (sendError || !sendData?.ok || !sendData?.reply_id) {
            throw new Error(`Failed to send message to bot ${botId}`);
          }

          try {
            response = await pollForReply(sendData.reply_id, botId, 30); // Shorter timeout for group chats
          } catch (pollError) {
            response = `Время ожидания ответа от бота ${botsMap.get(botId) || 'Бот'} истекло.`;
          }
        } else {
          // Use synchronous approach for OpenAI bots
          const payload: ApiRequest = {
            bot_id: botId,
            chat_id: chatId,
            message: messageContent
          };

          const { data, error } = await supabase.functions.invoke('chat', {
            body: payload
          });

          if (error) {
            throw new Error(`Error calling chat function for bot ${botId}: ${error.message}`);
          }

          if (!data || typeof data !== 'object' || !data.ok) {
            const errorMessage = data?.done || "Unknown error";
            throw new Error(`API returned error for bot ${botId}: ${errorMessage}`);
          }

          if (typeof data.done !== 'string') {
            throw new Error(`Invalid response format for bot ${botId}`);
          }

          response = data.done;
        }

        responses.push({
          botId,
          response,
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
    
    toast({
      title: "Ошибка",
      description: error.message || "Произошла ошибка при отправке сообщения",
      variant: "destructive",
    });
    
    throw error;
  }
}