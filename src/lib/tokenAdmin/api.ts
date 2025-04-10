
import { supabase } from "@/integrations/supabase/client";

/**
 * Base function to invoke token_admin edge function
 */
export const invokeTokenAdminFunction = async <T>(
  action: string, 
  params: Record<string, any> = {}
): Promise<T> => {
  try {
    console.log(`Invoking token_admin edge function: ${action}`, params);
    
    const { data, error } = await supabase.functions.invoke('token_admin', {
      body: { action, params },
    });

    if (error) {
      console.error(`Error in ${action}:`, error);
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error in ${action}:`, error);
    throw error;
  }
};

/**
 * Execute a custom SQL query
 */
export const executeCustomQuery = async (query: string): Promise<any[]> => {
  try {
    return await invokeTokenAdminFunction<any[]>('execute_query', { query });
  } catch (error) {
    console.error('Error executing custom query:', error);
    throw error;
  }
};

/**
 * Get tokens belonging to a specific admin
 */
export const getAdminTokens = async (adminId: string) => {
  try {
    console.log('Fetching tokens for admin:', adminId);
    const { data, error } = await supabase.rpc('get_admin_tokens', { admin_id: adminId });
    
    if (error) {
      console.error('Error fetching admin tokens:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAdminTokens:', error);
    throw error;
  }
};

/**
 * Transfer token ownership to another admin
 */
export const transferToken = async (tokenId: string, newAdminId: string) => {
  try {
    console.log('Transferring token:', tokenId, 'to admin:', newAdminId);
    const { data, error } = await supabase.rpc('transfer_token', { 
      token_id: tokenId, 
      new_admin_id: newAdminId 
    });
    
    if (error) {
      console.error('Error transferring token:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in transferToken:', error);
    throw error;
  }
};
