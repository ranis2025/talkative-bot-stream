
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
    
    console.log(`Sending message to bot: ${botId}, chat: ${chatId}`);
    
    // Create the payload for the API
    const payload: ApiRequest = {
      bot_id: botId,  // This is passed as a string to the edge function
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
    
    // If the error is related to JSON parsing, provide a more helpful message
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error("JSON parse error - Got non-JSON response from server");
      throw new Error("Server returned an invalid response format. This could be due to network issues or server configuration problems.");
    }
    
    throw error;
  }
}
