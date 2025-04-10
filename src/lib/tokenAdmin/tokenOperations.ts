
import { TokenRecord } from "./types";
import { invokeTokenAdminFunction } from "./api";

/**
 * Fetch all tokens from the database
 */
export const getTokens = async (): Promise<TokenRecord[]> => {
  try {
    console.log('Fetching tokens from edge function');
    return await invokeTokenAdminFunction<TokenRecord[]>('token_get_all');
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
    
    // Make sure adminId is not undefined before passing it to the edge function
    const data = await invokeTokenAdminFunction<{ id: string }>('token_add', { 
      token, 
      name, 
      description,
      admin_id: adminId || null // Ensure we pass null if adminId is undefined
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
    await invokeTokenAdminFunction('token_update', { 
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
    await invokeTokenAdminFunction('token_delete', { id });
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};

/**
 * Fetch tokens belonging to a specific admin
 */
export const getAdminTokens = async (adminId: string): Promise<TokenRecord[]> => {
  try {
    console.log('Fetching tokens for admin:', adminId);
    return await invokeTokenAdminFunction<TokenRecord[]>('token_get_admin', { admin_id: adminId });
  } catch (error) {
    console.error('Error getting admin tokens:', error);
    throw error;
  }
};
