
import { ApiRequest, ApiResponse } from "@/types/chat";
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
    
    // Create the payload for the API
    const payload: ApiRequest = {
      bot_id: botId,
      chat_id: chatId,
      message: message
    };

    // Call our Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('chat', {
      body: payload
    });

    if (error) {
      console.error("Error calling chat function:", error);
      throw new Error(`API error: ${error.message}`);
    }

    if (!data.ok) {
      throw new Error(data.done || "Unknown error");
    }

    return data.done;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
