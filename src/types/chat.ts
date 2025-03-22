
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
  botId?: string | null;
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
