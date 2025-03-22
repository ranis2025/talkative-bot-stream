
export type MessageRole = 'user' | 'bot';

export interface IMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: number;
}

export interface IChat {
  id: string;
  title: string;
  messages: IMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiRequest {
  bot_id: number;
  chat_id: string;
  message: string;
}

export interface ApiResponse {
  done: string;
}
