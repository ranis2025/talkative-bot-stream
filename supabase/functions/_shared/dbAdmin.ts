
import { getSupabaseClient } from "./db.ts";

// Function to execute custom SQL queries safely
export async function executeCustomQuery(params: { query: string }) {
  const supabase = getSupabaseClient();
  const { query } = params;
  
  console.log(`Executing custom SQL query: ${query}`);
  
  // Only allow SELECT queries for security
  if (!query.trim().toLowerCase().startsWith('select')) {
    console.error('Only SELECT queries are allowed');
    throw new Error('Only SELECT queries are allowed');
  }
  
  try {
    // Execute the query directly
    const { data, error } = await supabase.rpc('execute_query', {
      query_text: query
    });
    
    if (error) {
      console.error('Error executing query:', error);
      throw error;
    }
    
    console.log('Query executed successfully');
    return data;
  } catch (error) {
    console.error('Error in executeCustomQuery:', error);
    throw error;
  }
}
