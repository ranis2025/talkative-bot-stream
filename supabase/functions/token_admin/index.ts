
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== HANDLER FUNCTIONS ==========

// Get all tokens from access_tokens table
async function getTokens() {
  const { data: tokens, error: tokensError } = await supabase
    .from('access_tokens')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (tokensError) {
    console.error('Error fetching tokens:', tokensError);
    throw tokensError;
  }
  return tokens;
}

// Get token value by ID
async function getTokenValue(params) {
  const { token_id } = params;
  
  console.log(`Getting token value for ID: ${token_id}`);
  
  const { data: token, error: tokenError } = await supabase
    .from('access_tokens')
    .select('token')
    .eq('id', token_id)
    .single();
  
  if (tokenError) {
    console.error('Error fetching token value:', tokenError);
    throw tokenError;
  }
  
  console.log('Token value retrieved:', token);
  return { token: token.token };
}

// Get all bot assignments from token_bot_assignments table
async function getAssignedBots() {
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

// Add a new token to access_tokens table
async function addToken(params) {
  const { token: tokenValue, name, description } = params;
  const { data: newToken, error: addError } = await supabase
    .from('access_tokens')
    .insert([{ token: tokenValue, name, description }])
    .select()
    .single();
  
  if (addError) {
    console.error('Error adding token:', addError);
    throw addError;
  }
  return { success: true, id: newToken.id };
}

// Update a token in access_tokens table
async function updateToken(params) {
  const { id: updateId, name: updateName, description: updateDesc } = params;
  const { error: updateError } = await supabase
    .from('access_tokens')
    .update({ name: updateName, description: updateDesc, updated_at: new Date().toISOString() })
    .eq('id', updateId);
  
  if (updateError) {
    console.error('Error updating token:', updateError);
    throw updateError;
  }
  return { success: true };
}

// Delete a token from access_tokens table
async function deleteToken(params) {
  const { id: deleteId } = params;
  const { error: deleteError } = await supabase
    .from('access_tokens')
    .delete()
    .eq('id', deleteId);
  
  if (deleteError) {
    console.error('Error deleting token:', deleteError);
    throw deleteError;
  }
  return { success: true };
}

// Check if a bot assignment already exists
async function checkExistingAssignment(tokenId, botId) {
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
async function createBotAssignment(tokenId, botId, botToken, botName) {
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
async function syncWithChatBots(botId, botToken, botName, tokenValue) {
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
async function assignBotToToken(params) {
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
      await syncWithChatBots(bot_id, bot_token, bot_name, token_value);
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
async function removeAssignment(params) {
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

// Process a request based on the action
async function processAction(action, params) {
  console.log(`Processing action: ${action} with params:`, params);
  
  switch (action) {
    case 'get_tokens':
      return await getTokens();
    
    case 'get_token_value':
      return await getTokenValue(params);
      
    case 'get_assigned_bots':
      return await getAssignedBots();
    
    case 'add_token':
      return await addToken(params);
    
    case 'update_token':
      return await updateToken(params);
    
    case 'delete_token':
      return await deleteToken(params);
    
    case 'assign_bot_to_token':
      return await assignBotToToken(params);
    
    case 'remove_assignment':
      return await removeAssignment(params);
    
    default:
      console.error('Invalid action requested:', action);
      throw new Error('Invalid action');
  }
}

// ========== MAIN HANDLER ==========

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { action, params } = await req.json();

    // Process the action and get the result
    const result = await processAction(action, params);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in token_admin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
