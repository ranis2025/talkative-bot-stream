
import { supabase } from "@/integrations/supabase/client";

// Define interfaces for our token administration
export interface TokenRecord {
  id: string;
  token: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignedBot {
  id: string;
  token_id: string;
  bot_id: string;
  bot_name: string;
  created_at: string;
}

// RPC methods for token administration
// These are temporary implementations that will call our edge function
// until we have actual database tables

export const getTokens = async (): Promise<TokenRecord[]> => {
  try {
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { action: 'get_tokens', params: {} },
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

export const getAssignedBots = async (): Promise<AssignedBot[]> => {
  try {
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { action: 'get_assigned_bots', params: {} },
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting assigned bots:', error);
    throw error;
  }
};

export const addToken = async (token: string, name: string, description?: string): Promise<string> => {
  try {
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'add_token', 
        params: { token, name, description } 
      },
    });

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding token:', error);
    throw error;
  }
};

export const updateToken = async (id: string, name: string, description?: string): Promise<void> => {
  try {
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'update_token', 
        params: { id, name, description } 
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
};

export const deleteToken = async (id: string): Promise<void> => {
  try {
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'delete_token', 
        params: { id } 
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};

export const assignBotToToken = async (tokenId: string, botId: string): Promise<string> => {
  try {
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'assign_bot_to_token', 
        params: { token_id: tokenId, bot_id: botId } 
      },
    });

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error assigning bot to token:', error);
    throw error;
  }
};

export const removeAssignment = async (id: string): Promise<void> => {
  try {
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'remove_assignment', 
        params: { id } 
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error removing assignment:', error);
    throw error;
  }
};
