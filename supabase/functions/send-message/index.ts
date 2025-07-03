import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1'
import { corsHeaders } from '../_shared/cors.ts'

const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bot_id, chat_id, message, bot_token } = await req.json();
    
    if (!bot_id || !chat_id || !message || !bot_token) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Missing required parameters: bot_id, chat_id, message, or bot_token" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Generate unique message_id
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Sending message to Pro-Talk API: bot_id=${bot_id}, chat_id=${chat_id}, message_id=${messageId}`);

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

    // Save message status to database
    const { error: dbError } = await supabaseClient
      .from('message_status')
      .insert({
        message_id: messageId,
        chat_id: chat_id,
        bot_id: bot_id,
        status: 'pending'
      });

    if (dbError) {
      console.error("Error saving message status:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Send message to Pro-Talk API
    const apiUrl = `${API_BASE_URL}/replica_webhook`;
    const data = {
      'message': {
        'message_id': messageId,
        'chat': {'id': bot_id, 'username': '', 'botname': ''},
        'text': message,
      }
    };
    const payload = {'promt_id': bot_id, 'api_token': bot_token};
    
    console.log(`Sending to Pro-Talk API: ${apiUrl}`);
    console.log(`Payload:`, payload);
    console.log(`Data:`, data);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data) + '?' + new URLSearchParams(payload).toString(),
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
          error_message: `API error: ${response.status} - ${errorText.substring(0, 200)}` 
        })
        .eq('message_id', messageId);
        
      throw new Error(`Pro-Talk API returned status ${response.status}: ${errorText}`);
    }

    // Update status to processing
    await supabaseClient
      .from('message_status')
      .update({ status: 'processing' })
      .eq('message_id', messageId);

    console.log(`Message sent successfully, message_id: ${messageId}`);
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message_id: messageId,
        status: 'processing'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in send-message function:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error.message || "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});