
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { 
  getTokens, 
  getTokenValue, 
  addToken, 
  updateToken, 
  deleteToken 
} from "./tokenHandlers.ts";
import { 
  getAssignedBots, 
  assignBotToToken, 
  removeAssignment 
} from "./assignmentHandlers.ts";
import { executeCustomQuery } from "../_shared/dbAdmin.ts";

// Process a request based on the action
async function processAction(action: string, params: Record<string, any>) {
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
      
    case 'execute_query':
      return await executeCustomQuery({ query: params.query });
    
    default:
      console.error('Invalid action requested:', action);
      throw new Error('Invalid action');
  }
}

// Main handler
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
