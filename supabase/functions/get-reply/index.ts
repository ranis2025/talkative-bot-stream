import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bot_id, chat_id, message_id, bot_token } = await req.json();
    
    if (!bot_id || !chat_id || !message_id || !bot_token) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Missing required parameters: bot_id, chat_id, message_id, or bot_token" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Getting reply from Pro-Talk API: bot_id=${bot_id}, chat_id=${chat_id}, message_id=${message_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables not set");
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check current status in database
    const { data: statusData, error: statusError } = await supabaseClient
      .from('message_status')
      .select('*')
      .eq('message_id', message_id)
      .single();

    if (statusError) {
      console.error("Error fetching message status:", statusError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Message status not found: ${statusError.message}` 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // If already completed or error, return cached status
    if (statusData.status === 'completed' || statusData.status === 'error') {
      return new Response(
        JSON.stringify({ 
          ok: statusData.status === 'completed', 
          status: statusData.status,
          message: statusData.status === 'error' ? statusData.error_message : 'Reply ready',
          reply: statusData.status === 'completed' ? statusData.reply : null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Call Pro-Talk API to get reply
    const apiUrl = `${API_BASE_URL}/replica_get_reply?promt_id=${bot_id}&api_token=${bot_token}`;
    const data = {
      'message': {
        'message_id': message_id,
        'chat': {'id': chat_id, 'username': ''},
      }
    };
    
    console.log(`Calling Pro-Talk API: ${apiUrl}`);
    console.log(`Data:`, data);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log(`Pro-Talk API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pro-Talk API error: ${response.status} - ${errorText}`);
      
      // Update status to error
      await supabaseClient
        .from('message_status')
        .update({ 
          status: 'error', 
          error_message: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
          retry_count: statusData.retry_count + 1
        })
        .eq('message_id', message_id);
        
      return new Response(
        JSON.stringify({ 
          ok: false, 
          status: 'error',
          error: `Pro-Talk API returned status ${response.status}: ${errorText.substring(0, 200)}` 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const responseData = await response.json();
    console.log("Pro-Talk API response data:", responseData);

    // Check if reply is ready
    if (responseData && responseData.message) {
      // Reply is ready - update status to completed
      await supabaseClient
        .from('message_status')
        .update({ 
          status: 'completed',
          reply: responseData.message
        })
        .eq('message_id', message_id);

      return new Response(
        JSON.stringify({ 
          ok: true, 
          status: 'completed',
          reply: responseData.message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      // Reply not ready yet - keep processing status
      console.log("Reply not ready yet, keeping processing status");
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          status: 'processing',
          message: 'Reply not ready yet'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error in get-reply function:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        status: 'error',
        error: error.message || "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
