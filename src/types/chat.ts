
export interface IMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: number;
  bot_id?: string;
  bot_name?: string;
  [key: string]: any; // Adding index signature to make it compatible with Json
}

export interface IChat {
  id: string;
  title: string;
  messages: IMessage[];
  bot_id?: string | null;
  bots_ids?: string[];
  is_group_chat?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ApiRequest {
  bot_id: string;
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
  token?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  token: string;
  email?: string;
  default_bot_id?: string;
  theme?: string;
  created_at: string;
  updated_at: string;
}

// Add this to make IMessage compatible with Supabase Json type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
