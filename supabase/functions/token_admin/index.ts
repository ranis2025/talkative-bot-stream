
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleTokenOperation } from "./tokenHandlers.ts";
import { handleAssignmentOperation } from "./assignmentHandlers.ts";
import { executeCustomQuery } from "../_shared/dbAdmin.ts";
import { handleBotAssignmentOperation } from "./botAssignmentHandler.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { action, params } = await req.json();
    console.log(`Processing action: ${action} with params:`, params);

    let result;

    // Route to the appropriate handler based on the action
    if (action.startsWith("token_") || action.startsWith("get_") || action.startsWith("add_") || 
        action.startsWith("update_") || action.startsWith("delete_") || action.startsWith("transfer_")) {
      result = await handleTokenOperation(action, params);
    } else if (action.startsWith("assignment_")) {
      result = await handleAssignmentOperation(action, params);
    } else if (action === "assign_bot_to_token" || action === "get_assigned_bots") {
      result = await handleBotAssignmentOperation(action, params);
    } else if (action === "execute_query") {
      // Handle custom query execution
      result = await executeCustomQuery(params);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`Error in token_admin function:`, error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
