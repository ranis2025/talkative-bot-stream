import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export interface MessageStatus {
  id: string;
  message_id: string;
  chat_id: string;
  bot_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  retry_count: number;
  reply?: string;
  created_at: string;
  updated_at: string;
}

// Send message asynchronously and return message_id for tracking
export async function sendMessageAsync(chatId: string, message: string, files?: { name: string; size: number; type: string; url: string; file?: File }[], specificBotId?: string | null): Promise<string> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlBotId = urlParams.get('bot_id');
    const botId = specificBotId || urlBotId;
    
    if (!botId) {
      console.error("No bot ID found in URL or provided as parameter");
      throw new Error("Bot ID is required");
    }
    
    // Get bot token from database
    const { data: botData, error: botError } = await supabase
      .from("chat_bots")
      .select("bot_token")
      .eq("bot_id", botId)
      .limit(1)
      .maybeSingle();
    
    if (botError || !botData?.bot_token) {
      console.error("Bot token not found:", botError);
      throw new Error("Bot token not found");
    }
    
    console.log(`Sending async message to bot: ${botId}, chat: ${chatId}`);
    
    let messageContent = message;
    if (files && files.length > 0) {
      if (messageContent && messageContent.trim() !== '') {
        messageContent += '\n\n';
      }
      
      const fileUrls = files.map(file => file.url).join('\n');
      messageContent += fileUrls;
    }
    
    console.log(`Prepared message content with files:`, messageContent);
    
    const payload = {
      bot_id: botId,
      chat_id: chatId,
      message: messageContent,
      bot_token: botData.bot_token
    };

    console.log(`Sending payload to send-message function:`, payload);
    const { data, error } = await supabase.functions.invoke('send-message', {
      body: payload
    });

    if (error) {
      console.error("Error calling send-message function:", error);
      throw new Error(`Send message error: ${error.message}`);
    }

    if (!data || !data.ok) {
      console.error("Send message failed:", data);
      throw new Error(data?.error || "Failed to send message");
    }

    console.log("Message sent successfully, message_id:", data.message_id);
    return data.message_id;
  } catch (error) {
    console.error("Error sending async message:", error);
    throw error;
  }
}

// Poll for reply using message_id
export async function pollForReply(messageId: string, botId: string, chatId: string): Promise<{ status: string; reply?: string; error?: string }> {
  try {
    // Get bot token from database
    const { data: botData, error: botError } = await supabase
      .from("chat_bots")
      .select("bot_token")
      .eq("bot_id", botId)
      .limit(1)
      .maybeSingle();
    
    if (botError || !botData?.bot_token) {
      console.error("Bot token not found:", botError);
      throw new Error("Bot token not found");
    }

    const payload = {
      bot_id: botId,
      chat_id: chatId,
      message_id: messageId,
      bot_token: botData.bot_token
    };

    console.log(`Polling for reply: ${messageId}`);
    const { data, error } = await supabase.functions.invoke('get-reply', {
      body: payload
    });

    if (error) {
      console.error("Error calling get-reply function:", error);
      throw new Error(`Get reply error: ${error.message}`);
    }

    console.log("Poll response:", data);
    return {
      status: data.status,
      reply: data.reply,
      error: data.error
    };
  } catch (error) {
    console.error("Error polling for reply:", error);
    return {
      status: 'error',
      error: error.message || "Unknown error"
    };
  }
}

// Get message status from database
export async function getMessageStatus(messageId: string): Promise<MessageStatus | null> {
  try {
    const { data, error } = await supabase
      .from('message_status')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) {
      console.error("Error fetching message status:", error);
      return null;
    }

    return data as MessageStatus;
  } catch (error) {
    console.error("Error getting message status:", error);
    return null;
  }
}

// Start polling for a message reply with automatic retries
export function startPolling(
  messageId: string, 
  botId: string, 
  chatId: string, 
  onUpdate: (status: string, reply?: string, error?: string) => void,
  interval: number = 5000,
  maxAttempts: number = 60 // 5 minutes max
): () => void {
  let attempts = 0;
  let timeoutId: NodeJS.Timeout;

  const poll = async () => {
    attempts++;
    
    if (attempts > maxAttempts) {
      onUpdate('error', undefined, 'Timeout: No response received after 5 minutes');
      return;
    }

    try {
      const result = await pollForReply(messageId, botId, chatId);
      
      if (result.status === 'completed') {
        onUpdate('completed', result.reply);
        return;
      } else if (result.status === 'error') {
        onUpdate('error', undefined, result.error);
        return;
      } else if (result.status === 'processing' || result.status === 'pending') {
        // Continue polling
        timeoutId = setTimeout(poll, interval);
      }
    } catch (error) {
      console.error("Polling error:", error);
      onUpdate('error', undefined, error.message || 'Unknown polling error');
    }
  };

  // Start polling
  timeoutId = setTimeout(poll, interval);

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

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