
import { ApiRequest, ApiResponse } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Функция для получения параметров из URL
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const botId = urlParams.get('bot_id');
  const botToken = urlParams.get('bot_token');
  
  // Проверка наличия обязательных параметров
  if (!botId || !botToken) {
    console.warn('Missing required URL parameters: bot_id or bot_token');
  }
  
  return {
    botId: botId || null,
    botToken: botToken || null
  };
}

// Функция для получения данных бота из Supabase
async function getBotData(botId: string | null) {
  if (!botId) return null;
  
  try {
    const { data, error } = await supabase
      .from('chat_bots')
      .select('*')
      .eq('bot_id', botId)
      .single();
      
    if (error) {
      console.error("Error fetching bot data:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getBotData:", error);
    return null;
  }
}

// Функция для отправки запроса к OpenAI
async function sendToOpenAI(message: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Вы — полезный ассистент, который отвечает на запросы клиентов." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

export async function sendMessage(chatId: string, message: string, specificBotId?: string | null): Promise<string> {
  try {
    // Use provided bot ID or get from URL
    const { botId: urlBotId, botToken: urlBotToken } = getUrlParameters();
    const botId = specificBotId || urlBotId;
    
    if (!botId) {
      throw new Error("Bot ID is required");
    }
    
    // Получаем данные бота из Supabase
    const botData = await getBotData(botId);
    
    // Если у бота есть OpenAI ключ, используем его
    if (botData && botData.openai_key) {
      console.log("Using OpenAI for bot:", botId);
      return await sendToOpenAI(message, botData.openai_key);
    }
    
    // Если OpenAI ключа нет, используем стандартный API
    console.log("Using standard API for bot:", botId);
    const payload: ApiRequest = {
      bot_id: parseInt(botId),
      chat_id: chatId,
      message: message
    };

    // Use botToken from botData if available, otherwise from URL
    const botToken = botData?.bot_token || urlBotToken;
    
    if (!botToken) {
      throw new Error("Bot token is required");
    }

    const response = await fetch(`${API_BASE_URL}/ask/${botToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data: ApiResponse = await response.json();
    return data.done;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
