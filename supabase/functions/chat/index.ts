
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const API_BASE_URL = "https://api.pro-talk.ru/api/v1.0";

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
      console.log("Request body:", JSON.stringify(reqBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          done: "Invalid request format: Unable to parse JSON body" 
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
          done: "Missing required parameters: bot_id, chat_id, or message" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Received request with bot_id: ${bot_id}, chat_id: ${chat_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables not set");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          done: "Server configuration error: Missing Supabase credentials" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Retrieve bot details from database
    let botData;
    try {
      const { data, error } = await supabaseClient
        .from('chat_bots')
        .select('*')
        .eq('bot_id', bot_id)
        .maybeSingle();
      
      if (error) {
        console.error("Database query error:", error);
        throw new Error(`Error querying database: ${error.message}`);
      }
      
      if (!data) {
        console.error(`Bot not found with ID: ${bot_id}`);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            done: `Bot with ID ${bot_id} not found` 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      botData = data;
      console.log(`Bot found: ${botData.name}, has OpenAI key: ${!!botData.openai_key}, has Bot token: ${!!botData.bot_token}`);
    } catch (dbError) {
      console.error("Error retrieving bot data:", dbError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          done: `Error retrieving bot information: ${dbError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let response;

    // Option 1: Use OpenAI if key is available
    if (botData.openai_key) {
      console.log("Using OpenAI API for response");
      try {
        response = await sendToOpenAI(message, botData.openai_key);
      } catch (error) {
        console.error("OpenAI API error:", error);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            done: `OpenAI API error: ${error.message || "Unknown error"}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } 
    // Option 2: Use external API with bot token
    else if (botData.bot_token) {
      console.log("Using Pro-Talk API for response");
      try {
        response = await sendToExternalAPI(bot_id, chat_id, message, botData.bot_token);
      } catch (error) {
        console.error("Pro-Talk API error:", error);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            done: `Pro-Talk API error: ${error.message || "Unknown error"}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } 
    // No valid configuration
    else {
      console.error("Bot is not properly configured - missing both OpenAI key and bot token");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          done: "Bot is not properly configured with API keys" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, done: response }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        done: error.message || "Internal server error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function sendToOpenAI(message: string, apiKey: string): Promise<string> {
  try {
    console.log("Sending request to OpenAI API");
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Вы — полезный ассистент, который отвечает на запросы клиентов." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error response: ${response.status}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Successfully received response from OpenAI");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

async function sendToExternalAPI(botId: string, chatId: string, message: string, botToken: string): Promise<string> {
  try {
    // Per the OpenAPI spec, bot_id should be an integer
    const numericBotId = parseInt(botId);
    if (isNaN(numericBotId)) {
      throw new Error("Invalid bot_id: must be convertible to an integer");
    }
    
    const apiUrl = `${API_BASE_URL}/ask/${botToken}`;
    console.log(`Sending request to Pro-Talk API: ${apiUrl}`);
    
    const payload = {
      bot_id: numericBotId,  // Send as integer per API spec
      chat_id: chatId,
      message: message
    };
    
    console.log(`Request payload: ${JSON.stringify(payload)}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Safely handle the response even if it's not JSON
    const responseText = await response.text();
    console.log(`Pro-Talk API response status: ${response.status}`);
    console.log(`Pro-Talk API response body: ${responseText}`);
    
    if (!response.ok) {
      console.error(`Pro-Talk API error: ${response.status} - ${responseText}`);
      throw new Error(`API returned status ${response.status}: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
    }

    // Try to parse the response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log("Successfully parsed Pro-Talk API response");
    } catch (parseError) {
      console.error("Error parsing Pro-Talk API response:", parseError, "Response was:", responseText);
      throw new Error(`Failed to parse API response as JSON. Raw response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
    }

    if (!parsedResponse.done) {
      console.error("API response missing 'done' field:", parsedResponse);
      throw new Error("API response missing 'done' field");
    }

    return parsedResponse.done;
  } catch (error) {
    console.error("Error sending message to external API:", error);
    throw error;
  }
}
