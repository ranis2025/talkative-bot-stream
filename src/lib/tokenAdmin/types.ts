
// Define interfaces for token administration
export interface TokenRecord {
  id: string;
  token: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  admin_id?: string | null;
}

export interface AssignedBot {
  id: string;
  token_id: string;
  bot_id: string;
  bot_name: string;
  bot_token?: string;
  created_at: string;
  access_tokens?: TokenRecord | null;
}

