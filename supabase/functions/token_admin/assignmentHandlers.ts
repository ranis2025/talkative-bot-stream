
import { getSupabaseClient } from "../_shared/db.ts";

// Get all bot assignments from token_bot_assignments table
export async function getAssignedBots() {
  const supabase = getSupabaseClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from('token_bot_assignments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    throw assignmentsError;
  }
  return assignments;
}

// Check if a bot assignment already exists
async function checkExistingAssignment(tokenId: string, botId: string) {
  const supabase = getSupabaseClient();
  console.log(`Checking for existing assignment with tokenId=${tokenId} and botId=${botId}`);
  
  const { data: existingAssignment, error: checkError } = await supabase
    .from('token_bot_assignments')
    .select('*')
    .eq('token_id', tokenId)
    .eq('bot_id', botId)
    .maybeSingle();
  
  if (checkError) {
    console.error('Error checking existing assignment:', checkError);
    throw checkError;
  }
  
  console.log('Existing assignment check result:', existingAssignment);
  return existingAssignment;
}

// Create a new bot assignment
async function createBotAssignment(tokenId: string, botId: string, botToken: string, botName: string) {
  const supabase = getSupabaseClient();
  console.log('Creating new bot assignment with params:', { tokenId, botId, botToken, botName });
  
  const { data: newAssignment, error: assignError } = await supabase
    .from('token_bot_assignments')
    .insert([{ 
      token_id: tokenId, 
      bot_id: botId, 
      bot_token: botToken, 
      bot_name: botName 
    }])
    .select()
    .single();
  
  if (assignError) {
    console.error('Database error when assigning bot:', assignError);
    throw assignError;
  }
  
  console.log('New assignment created:', newAssignment);
  return newAssignment;
}

// Sync bot assignment with chat_bots table
async function syncWithChatBots(botId: string, botToken: string, botName: string, tokenValue: string) {
  const supabase = getSupabaseClient();
  console.log('Syncing bot assignment with chat_bots table:', { botId, botName, tokenValue });
  
  if (!tokenValue) {
    console.log('No token value provided, skipping chat_bots sync');
    return;
  }

  // Check if a record already exists
  const { data: existingBot, error: checkError } = await supabase
    .from('chat_bots')
    .select('*')
    .eq('bot_id', botId)
    .eq('token', tokenValue)
    .maybeSingle();
    
  if (checkError) {
    console.error('Error checking existing chat bot:', checkError);
    // Don't throw - we don't want this to block the main operation
  }
  
  if (existingBot) {
    console.log('Existing chat bot found, updating:', existingBot);
    // Update existing record
    const { error: updateError } = await supabase
      .from('chat_bots')
      .update({ 
        bot_token: botToken,
        name: botName,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBot.id);
      
    if (updateError) {
      console.error('Error updating chat bot:', updateError);
      // Don't throw - we don't want this to block the main operation
    }
  } else {
    console.log('No existing chat bot found, creating new one');
    // Create new record
    const { error: insertError } = await supabase
      .from('chat_bots')
      .insert([{ 
        bot_id: botId, 
        bot_token: botToken, 
        name: botName,
        token: tokenValue
      }]);
      
    if (insertError) {
      console.error('Error inserting chat bot:', insertError);
      // Don't throw - we don't want this to block the main operation
    }
  }
  
  console.log('Sync with chat_bots completed');
}

// Assign a bot to a token
export async function assignBotToToken(params: { 
  token_id: string; 
  bot_id: string; 
  bot_token: string; 
  bot_name: string; 
  token_value?: string;
}) {
  const { token_id, bot_id, bot_token, bot_name, token_value } = params;
  
  // Log received data for debugging
  console.log('Assigning bot to token with params:', { token_id, bot_id, bot_token, bot_name, token_value });
  
  // Verify all required parameters are present
  if (!token_id || !bot_id || !bot_token || !bot_name) {
    console.error('Missing required parameters:', { token_id, bot_id, bot_token, bot_name });
    throw new Error('Missing required parameters for bot assignment');
  }
  
  try {
    // First check if this assignment already exists to avoid duplicates
    const existingAssignment = await checkExistingAssignment(token_id, bot_id);
    
    let assignment;
    if (existingAssignment) {
      console.log('Assignment already exists, returning existing data');
      assignment = existingAssignment;
    } else {
      // Insert the new assignment
      assignment = await createBotAssignment(token_id, bot_id, bot_token, bot_name);
      console.log('New assignment created:', assignment);
    }
    
    // Sync with chat_bots table
    try {
      await syncWithChatBots(bot_id, bot_token, bot_name, token_value || '');
    } catch (syncError) {
      console.error('Error syncing with chat_bots:', syncError);
      // Continue even if sync fails
    }
    
    console.log('Assignment successful, returning data:', assignment);
    
    return { 
      success: true, 
      id: assignment.id,
      token_id: assignment.token_id,
      bot_id: assignment.bot_id,
      bot_name: assignment.bot_name,
      bot_token: assignment.bot_token,
      token_value
    };
  } catch (error) {
    console.error('Error in assignBotToToken:', error);
    throw error;
  }
}

// Remove a bot assignment and also clean up chat_bots entry if exists
export async function removeAssignment(params: { id: string }) {
  const supabase = getSupabaseClient();
  const { id: removeId } = params;
  
  console.log('Removing assignment with ID:', removeId);
  
  // First, get the assignment details to retrieve token_id and bot_id
  const { data: assignment, error: getError } = await supabase
    .from('token_bot_assignments')
    .select('*')
    .eq('id', removeId)
    .single();
    
  if (getError) {
    console.error('Error getting assignment details:', getError);
    throw getError;
  }
  
  // Get the token value for the token_id
  const { data: tokenData, error: tokenError } = await supabase
    .from('access_tokens')
    .select('token')
    .eq('id', assignment.token_id)
    .single();
    
  if (!tokenError && tokenData) {
    // Try to remove matching entry from chat_bots
    try {
      const { error: chatBotDeleteError } = await supabase
        .from('chat_bots')
        .delete()
        .eq('bot_id', assignment.bot_id)
        .eq('token', tokenData.token);
        
      if (chatBotDeleteError) {
        console.log('Note: Could not delete from chat_bots:', chatBotDeleteError);
        // Continue anyway
      } else {
        console.log('Successfully removed matching chat_bots entry');
      }
    } catch (e) {
      console.log('Error trying to clean up chat_bots:', e);
      // Continue anyway
    }
  }
  
  // Now delete the assignment from token_bot_assignments
  const { error: removeError } = await supabase
    .from('token_bot_assignments')
    .delete()
    .eq('id', removeId);
  
  if (removeError) {
    console.error('Error removing assignment:', removeError);
    throw removeError;
  }
  
  console.log('Assignment removed successfully');
  
  return { success: true };
}
