
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
