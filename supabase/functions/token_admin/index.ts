
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        // Fetch tokens from the database
        const { data: tokens, error: tokensError } = await supabase
          .from('access_tokens')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (tokensError) throw tokensError;
        result = tokens;
        break;
        
      case 'get_assigned_bots':
        // Fetch assigned bots from the database
        const { data: assignments, error: assignmentsError } = await supabase
          .from('token_bot_assignments')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (assignmentsError) throw assignmentsError;
        result = assignments;
        break;

      case 'get_bots_by_token':
        // Fetch bots assigned to a specific token value
        const { token_value } = params;

        // First get the token id by token value
        const { data: tokenData, error: tokenError } = await supabase
          .from('access_tokens')
          .select('id')
          .eq('token', token_value)
          .single();

        if (tokenError) {
          if (tokenError.code === 'PGRST116') {
            // No token found
            return new Response(
              JSON.stringify({ error: 'Token not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw tokenError;
        }

        // Then get all bots assigned to this token id
        const { data: botAssignments, error: botsError } = await supabase
          .from('token_bot_assignments')
          .select('*')
          .eq('token_id', tokenData.id);

        if (botsError) throw botsError;
        result = botAssignments;
        break;
        
      case 'add_token':
        // Add a new token to the database
        const { token: tokenValue, name, description } = params;
        const { data: newToken, error: addTokenError } = await supabase
          .from('access_tokens')
          .insert({
            token: tokenValue,
            name,
            description
          })
          .select('id')
          .single();
          
        if (addTokenError) throw addTokenError;
        result = { success: true, id: newToken.id };
        break;
        
      case 'update_token':
        // Update an existing token
        const { id, name: updateName, description: updateDescription } = params;
        const { error: updateError } = await supabase
          .from('access_tokens')
          .update({
            name: updateName,
            description: updateDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (updateError) throw updateError;
        result = { success: true };
        break;
        
      case 'delete_token':
        // Delete a token (assignments will be automatically deleted due to ON DELETE CASCADE)
        const { id: deleteId } = params;
        const { error: deleteError } = await supabase
          .from('access_tokens')
          .delete()
          .eq('id', deleteId);
          
        if (deleteError) throw deleteError;
        result = { success: true };
        break;
        
      case 'assign_bot_to_token':
        // Assign a bot to a token
        const { token_id, bot_id, bot_token } = params;
        const { data: newAssignment, error: assignError } = await supabase
          .from('token_bot_assignments')
          .insert({
            token_id,
            bot_id,
            bot_token
          })
          .select('id')
          .single();
          
        if (assignError) throw assignError;
        result = { 
          success: true, 
          id: newAssignment.id,
          bot_id: bot_id,
          bot_token: bot_token
        };
        break;
        
      case 'remove_assignment':
        // Remove a bot assignment
        const { id: assignmentId } = params;
        const { error: removeError } = await supabase
          .from('token_bot_assignments')
          .delete()
          .eq('id', assignmentId);
          
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
