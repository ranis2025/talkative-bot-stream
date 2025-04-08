
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Handle different actions
    let result = null;
    switch (action) {
      case 'get_tokens':
        // Get all tokens from access_tokens table
        const { data: tokens, error: tokensError } = await supabase
          .from('access_tokens')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (tokensError) throw tokensError;
        result = tokens;
        break;

      case 'get_assigned_bots':
        // Get all bot assignments from token_bot_assignments table
        const { data: assignments, error: assignmentsError } = await supabase
          .from('token_bot_assignments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (assignmentsError) throw assignmentsError;
        result = assignments;
        break;

      case 'add_token':
        // Add a new token to access_tokens table
        const { token: tokenValue, name, description } = params;
        const { data: newToken, error: addError } = await supabase
          .from('access_tokens')
          .insert([{ token: tokenValue, name, description }])
          .select()
          .single();
        
        if (addError) throw addError;
        result = { success: true, id: newToken.id };
        break;

      case 'update_token':
        // Update a token in access_tokens table
        const { id: updateId, name: updateName, description: updateDesc } = params;
        const { error: updateError } = await supabase
          .from('access_tokens')
          .update({ name: updateName, description: updateDesc, updated_at: new Date().toISOString() })
          .eq('id', updateId);
        
        if (updateError) throw updateError;
        result = { success: true };
        break;

      case 'delete_token':
        // Delete a token from access_tokens table
        const { id: deleteId } = params;
        const { error: deleteError } = await supabase
          .from('access_tokens')
          .delete()
          .eq('id', deleteId);
        
        if (deleteError) throw deleteError;
        result = { success: true };
        break;

      case 'assign_bot_to_token':
        // Add a bot assignment to token_bot_assignments table
        const { token_id, bot_id, bot_token, bot_name } = params;
        
        // Log received data for debugging
        console.log('Assigning bot to token with params:', { token_id, bot_id, bot_token, bot_name });
        
        const { data: newAssignment, error: assignError } = await supabase
          .from('token_bot_assignments')
          .insert([{ 
            token_id, 
            bot_id, 
            bot_token, 
            bot_name 
          }])
          .select()
          .single();
        
        if (assignError) {
          console.error('Database error when assigning bot:', assignError);
          throw assignError;
        }
        
        result = { 
          success: true, 
          id: newAssignment.id,
          bot_id,
          bot_token,
          bot_name
        };
        break;

      case 'remove_assignment':
        // Remove a bot assignment from token_bot_assignments table
        const { id: removeId } = params;
        const { error: removeError } = await supabase
          .from('token_bot_assignments')
          .delete()
          .eq('id', removeId);
        
        if (removeError) throw removeError;
        result = { success: true };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

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
