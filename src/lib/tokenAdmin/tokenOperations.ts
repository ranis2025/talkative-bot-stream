
import { TokenRecord } from "./types";
import { invokeTokenAdminFunction } from "./api";

/**
 * Fetch all tokens from the database
 */
export const getTokens = async (): Promise<TokenRecord[]> => {
  try {
    console.log('Fetching tokens from edge function');
    return await invokeTokenAdminFunction<TokenRecord[]>('get_tokens');
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

/**
 * Add a new token to the database
 */
export const addToken = async (token: string, name: string, description?: string, adminId?: string | null): Promise<string> => {
  try {
    console.log('Adding token via edge function:', { token, name, description, adminId });
    const data = await invokeTokenAdminFunction<{ id: string }>('add_token', { 
      token, 
      name, 
      description,
      admin_id: adminId
    });
    
    return data.id;
  } catch (error) {
    console.error('Error adding token:', error);
    throw error;
  }
};

/**
 * Update an existing token in the database
 */
export const updateToken = async (id: string, name: string, description?: string): Promise<void> => {
  try {
    console.log('Updating token via edge function:', { id, name, description });
    await invokeTokenAdminFunction('update_token', { 
      id, 
      name, 
      description 
    });
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
};

/**
 * Delete a token from the database
 */
export const deleteToken = async (id: string): Promise<void> => {
  try {
    console.log('Deleting token via edge function:', { id });
    await invokeTokenAdminFunction('delete_token', { id });
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};
