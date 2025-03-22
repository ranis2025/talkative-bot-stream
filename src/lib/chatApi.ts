
import { ApiRequest, ApiResponse } from "@/types/chat";

const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";
const BOT_ID = 14896; // Пример ID бота, замените на реальный
const BOT_TOKEN = "your_bot_token"; // Замените на ваш токен

export async function sendMessage(chatId: string, message: string): Promise<string> {
  try {
    const payload: ApiRequest = {
      bot_id: BOT_ID,
      chat_id: chatId,
      message: message
    };

    const response = await fetch(`${API_BASE_URL}/ask/${BOT_TOKEN}`, {
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
