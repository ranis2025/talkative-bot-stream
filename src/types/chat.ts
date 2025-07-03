
export interface ApiResponse {
  ok: boolean;
  done: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ChatBot {
  bot_id: string;
  created_at: string;
  name: string;
  token: string;
  openai_key?: string;
  bot_token?: string;
}

export interface UserSettings {
  token: string;
  default_bot_id?: string;
}

export interface IChat {
  id: string;
  title: string;
  messages: IMessage[];
  bot_id?: string | null;
  bots_ids?: string[];
  is_group_chat: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ApiRequest {
  bot_id: string;
  chat_id: string;
  message: string;
}

export interface IFile {
  name: string;
  size: number;
  type: string;
  url: string;
  file?: File;
}

export interface IMessage {
  id: string;
  content: string;
  role: "user" | "bot";
  timestamp: number;
  bot_id?: string;
  bot_name?: string;
  files?: IFile[];
  pending?: boolean;
  messageId?: string;
}
