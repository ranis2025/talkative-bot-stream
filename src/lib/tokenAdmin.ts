
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
  bot_token?: string;
  created_at: string;
}

// RPC methods for token administration that call our edge function
export const getTokens = async (): Promise<TokenRecord[]> => {
  try {
    console.log('Fetching tokens from edge function');
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { action: 'get_tokens', params: {} },
    });

    if (error) {
      console.error('Error in getTokens:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

export const getAssignedBots = async (): Promise<AssignedBot[]> => {
  try {
    console.log('Fetching assigned bots from edge function');
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { action: 'get_assigned_bots', params: {} },
    });

    if (error) {
      console.error('Error in getAssignedBots:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting assigned bots:', error);
    throw error;
  }
};

export const addToken = async (token: string, name: string, description?: string): Promise<string> => {
  try {
    console.log('Adding token via edge function:', { token, name, description });
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'add_token', 
        params: { token, name, description } 
      },
    });

    if (error) {
      console.error('Error in addToken:', error);
      throw error;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error adding token:', error);
    throw error;
  }
};

export const updateToken = async (id: string, name: string, description?: string): Promise<void> => {
  try {
    console.log('Updating token via edge function:', { id, name, description });
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'update_token', 
        params: { id, name, description } 
      },
    });

    if (error) {
      console.error('Error in updateToken:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
};

export const deleteToken = async (id: string): Promise<void> => {
  try {
    console.log('Deleting token via edge function:', { id });
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'delete_token', 
        params: { id } 
      },
    });

    if (error) {
      console.error('Error in deleteToken:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};

export const assignBotToToken = async (tokenId: string, botId: string, botToken: string, botName: string): Promise<string> => {
  try {
    console.log('Assigning bot to token via edge function:', { tokenId, botId, botToken, botName });
    
    // Call our edge function
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'assign_bot_to_token', 
        params: { 
          token_id: tokenId, 
          bot_id: botId, 
          bot_token: botToken, 
          bot_name: botName 
        } 
      },
    });

    if (error) {
      console.error('Error in assignBotToToken:', error);
      throw error;
    }
    
    if (!data || !data.id) {
      throw new Error('No data returned from assign_bot_to_token function');
    }
    
    return data.id;
  } catch (error) {
    console.error('Error assigning bot to token:', error);
    throw error;
  }
};

export const removeAssignment = async (id: string): Promise<void> => {
  try {
    console.log('Removing assignment via edge function:', { id });
    // Call our edge function
    const { error } = await supabase.functions.invoke('token_admin', {
      body: { 
        action: 'remove_assignment', 
        params: { id } 
      },
    });

    if (error) {
      console.error('Error in removeAssignment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error removing assignment:', error);
    throw error;
  }
};
