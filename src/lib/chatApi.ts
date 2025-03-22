
import { ApiRequest, ApiResponse } from "@/types/chat";

const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";

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
    botId: botId ? parseInt(botId) : 14896, // Используем дефолтное значение, если параметр не указан
    botToken: botToken || 'your_bot_token'  // Используем дефолтное значение, если параметр не указан
  };
}

export async function sendMessage(chatId: string, message: string): Promise<string> {
  try {
    // Получаем параметры из URL при каждом вызове функции
    const { botId, botToken } = getUrlParameters();
    
    const payload: ApiRequest = {
      bot_id: botId,
      chat_id: chatId, // Используем ID чата из истории переписок
      message: message
    };

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
