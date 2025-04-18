import { getSupabaseClient } from "../_shared/db.ts";

// Function to handle assigning a bot to a token
export async function assignBotToToken(params: { 
  token_id: string; 
  bot_id: string; 
  bot_name: string; 
  bot_token: string;
  token_value: string;
}) {
  const supabase = getSupabaseClient();
  const { token_id, bot_id, bot_name, bot_token, token_value } = params;
  
  console.log(`Assigning bot to token: ${token_id}, bot: ${bot_id}, name: ${bot_name}`);
  
  try {
    // First, add to token_bot_assignments
    const { data: assignment, error: assignmentError } = await supabase
      .from('token_bot_assignments')
      .insert([{ 
        token_id, 
        bot_id, 
        bot_name,
        bot_token
      }])
      .select('*')
      .single();
    
    if (assignmentError) {
      console.error('Error adding token-bot assignment:', assignmentError);
      throw assignmentError;
    }
    
    console.log('Token-bot assignment created:', assignment);
    
    // Also add to chat_bots table if token_value is provided
    if (token_value) {
      console.log(`Also adding to chat_bots table with token: ${token_value}`);
      
      const { data: chatBot, error: chatBotError } = await supabase
        .from('chat_bots')
        .insert([{
          bot_id,
          name: bot_name,
          bot_token,
          token: token_value
        }])
        .select()
        .single();
      
      if (chatBotError) {
        console.error('Warning: Could not add to chat_bots table:', chatBotError);
        // We still return success even if chat_bots insert fails
      } else {
        console.log('Added to chat_bots table:', chatBot);
      }
    }
    
    return assignment;
  } catch (error) {
    console.error('Error in assignBotToToken:', error);
    throw error;
  }
}

// Function to get all assigned bots with token information, filtered by admin_id
export async function getAssignedBots(adminId?: string) {
  const supabase = getSupabaseClient();
  try {
    let query = supabase
      .from('token_bot_assignments')
      .select(`
        *,
        access_tokens (
          id,
          token,
          name,
          admin_id
        )
      `)
      .order('created_at', { ascending: false });
    
    // If adminId is provided, filter assignments by admin_id
    if (adminId) {
      query = query.eq('access_tokens.admin_id', adminId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching token-bot assignments:', error);
      throw error;
    }
    
    // Filter out assignments where the token no longer exists
    const validAssignments = data.filter(assignment => assignment.access_tokens !== null);
    
    return validAssignments;
  } catch (error) {
    console.error('Error in getAssignedBots:', error);
    throw error;
  }
}

// Handle bot assignment operations based on action type
export function handleBotAssignmentOperation(action: string, params: any) {
  console.log(`Handling bot assignment operation: ${action} with params:`, params);
  
  switch (action) {
    case 'get_assigned_bots':
      return getAssignedBots(params?.admin_id);
    case 'assign_bot_to_token':
      return assignBotToToken(params);
    default:
      throw new Error(`Unknown bot assignment action: ${action}`);
  }
}
