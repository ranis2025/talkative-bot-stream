import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const API_BASE_URL = "https://us1.api.pro-talk.ru/api/v1.0";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let reqBody;
    try {
      reqBody = await req.json();
      console.log("Send message request body:", JSON.stringify(reqBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Invalid request format: Unable to parse JSON body" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { bot_id, chat_id, message } = reqBody;
    
    if (!bot_id || !chat_id || !message) {
      console.error("Missing required parameters:", { bot_id, chat_id, message: message ? "provided" : "missing" });
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Missing required parameters: bot_id, chat_id, or message" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Sending message to ProTalk API - bot_id: ${bot_id}, chat_id: ${chat_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables not set");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Server configuration error: Missing Supabase credentials" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get bot data from database
    let botData;
    try {
      const { data, error } = await supabaseClient
        .from('chat_bots')
        .select('*')
        .eq('bot_id', bot_id)
        .limit(1);
      
      if (error) {
        console.error("Database query error:", error);
        throw new Error(`Error querying database: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.error(`Bot not found with ID: ${bot_id}`);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: `Bot with ID ${bot_id} not found` 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      botData = data[0];
      console.log(`Bot found: ${botData.name}, has bot token: ${!!botData.bot_token}`);
    } catch (dbError) {
      console.error("Error retrieving bot data:", dbError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Error retrieving bot information: ${dbError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Only handle ProTalk API bots with bot_token
    if (!botData.bot_token) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "This function only handles ProTalk API bots with bot_token" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    try {
      // Send message to ProTalk API
      const numericBotId = parseInt(bot_id);
      if (isNaN(numericBotId)) {
        throw new Error("Invalid bot_id: must be convertible to an integer");
      }
      
      const apiUrl = `${API_BASE_URL}/ask/${botData.bot_token}`;
      console.log(`Sending message to ProTalk API: ${apiUrl}`);
      
      const payload = {
        bot_id: numericBotId,
        chat_id: chat_id,
        message: message
      };
      
      console.log(`ProTalk API payload: ${JSON.stringify(payload)}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`ProTalk API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ProTalk API error: ${response.status} - ${errorText.substring(0, 200)}`);
        throw new Error(`ProTalk API returned status ${response.status}: ${errorText.substring(0, 200)}`);
      }

      // Generate the reply polling ID (same format as ProTalk expects)
      const replyId = `ask${chat_id}_${numericBotId}`;
      
      console.log(`Message sent successfully. Reply ID: ${replyId}`);
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          reply_id: replyId,
          message: "Message sent successfully. Use get-reply to poll for response."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (error) {
      console.error("Error sending message to ProTalk API:", error);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to send message: ${error.message || "Unknown error"}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in send-message function:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: `Unhandled server error: ${error.message || "Unknown error"}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});