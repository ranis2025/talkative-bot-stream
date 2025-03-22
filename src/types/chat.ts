
export interface IMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: number;
}

export interface IChat {
  id: string;
  title: string;
  messages: IMessage[];
  bot_id?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ApiRequest {
  bot_id: number;
  chat_id: string;
  message: string;
}

export interface ApiResponse {
  ok: boolean;
  done: string;
}

export interface ChatBot {
  id: string;
  name: string;
  bot_id: string;
  bot_token?: string;
  openai_key?: string;
  created_at: string;
  updated_at: string;
}
