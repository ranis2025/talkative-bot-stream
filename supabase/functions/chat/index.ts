
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

    // Retrieve bot details from database - fix for the multiple rows issue
    let botData;
    try {
      // First try to get an exact match with eq
      let { data, error } = await supabaseClient
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
            done: `Bot with ID ${bot_id} not found` 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Take the first match if multiple are found
      botData = data[0];
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
        
        if (!response) {
          throw new Error("Empty response received from OpenAI");
        }
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
        
        if (!response) {
          throw new Error("Empty response received from Pro-Talk API");
        }
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

    // Prepare server logs
    const serverLogs = {
      timestamp: new Date().toISOString(),
      botId: bot_id,
      chatId: chat_id,
      method: botData.openai_key ? 'OpenAI' : 'Pro-Talk API',
      responseLength: response.length,
      success: true,
      botName: botData.name
    };
    
    // Add polling logs for Pro-Talk API
    if (botData.bot_token && (globalThis as any).pollingLogs) {
      serverLogs.pollingDetails = (globalThis as any).pollingLogs;
      // Clear the global logs
      delete (globalThis as any).pollingLogs;
    }
    
    console.log("Sending successful response with data:", { responseLength: response.length });
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        done: response, 
        server_logs: JSON.stringify(serverLogs) 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unhandled error in Edge Function:", error);
    const errorLogs = {
      timestamp: new Date().toISOString(),
      error: "Unhandled server error",
      details: error.message || "Unknown error",
      stack: error.stack
    };
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        done: `Unhandled server error: ${error.message || "Unknown error"}`,
        server_logs: JSON.stringify(errorLogs)
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
      console.error(`OpenAI API error status: ${response.status}`, errorText);
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenAI response format:", data);
      throw new Error("Invalid response format from OpenAI");
    }
    
    console.log("Successfully received response from OpenAI");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in sendToOpenAI function:", error);
    throw error;
  }
}

async function sendToExternalAPI(botId: string, chatId: string, message: string, botToken: string): Promise<string> {
  const pollingLogs = [];
  
  try {
    const numericBotId = parseInt(botId);
    if (isNaN(numericBotId)) {
      throw new Error("Invalid bot_id: must be convertible to an integer");
    }
    
    // Step 1: Send message async
    const sendUrl = `${API_BASE_URL}/send_message_async`;
    console.log(`Sending async message to Pro-Talk API: ${sendUrl}`);
    pollingLogs.push(`${new Date().toISOString()}: Отправка сообщения на ${sendUrl}`);
    
    const sendPayload = {
      bot_id: numericBotId,
      bot_token: botToken,
      bot_chat_id: chatId,
      message: message
    };
    
    console.log(`Send payload: ${JSON.stringify(sendPayload)}`);
    pollingLogs.push(`${new Date().toISOString()}: Payload: ${JSON.stringify(sendPayload)}`);
    
    const sendResponse = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendPayload),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error(`Pro-Talk send API error: ${sendResponse.status} - ${errorText}`);
      pollingLogs.push(`${new Date().toISOString()}: ОШИБКА отправки: ${sendResponse.status} - ${errorText}`);
      throw new Error(`Failed to send message: ${sendResponse.status} - ${errorText}`);
    }

    console.log("Message sent successfully, starting polling for reply");
    pollingLogs.push(`${new Date().toISOString()}: Сообщение отправлено успешно, начинаем опрос ответа`);

    // Step 2: Poll for reply with exponential backoff
    const replyUrl = `${API_BASE_URL}/get_last_reply`;
    const replyPayload = {
      bot_id: numericBotId,
      bot_token: botToken,
      bot_chat_id: chatId
    };
    
    let reply = '';
    let attempts = 0;
    const maxAttempts = 25; // Reduced from 60 to 25 (2-3 minutes max)
    const baseDelay = 2000; // 2 seconds base delay
    const maxDelay = 30000; // 30 seconds max delay
    let consecutiveErrors = 0;
    
    pollingLogs.push(`${new Date().toISOString()}: Начинаем опрос с экспоненциальной задержкой (максимум ${maxAttempts} попыток)`);
    
    while (reply === '' && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      pollingLogs.push(`${new Date().toISOString()}: Попытка опроса ${attempts}/${maxAttempts}`);
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      //const delay = exponentialDelay + jitter;
      const delay = baseDelay;
      
      pollingLogs.push(`${new Date().toISOString()}: Ожидание ${Math.round(delay)}мс (экспоненциальная задержка)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const replyResponse = await fetch(replyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(replyPayload),
        });

        const status = replyResponse.status;
        pollingLogs.push(`${new Date().toISOString()}: HTTP статус: ${status}`);

        // Handle different HTTP status codes
        if (status === 200) {
          const replyData = await replyResponse.json();
          pollingLogs.push(`${new Date().toISOString()}: Ответ сервера: ${JSON.stringify(replyData)}`);
          
          if (replyData.message && replyData.message !== '') {
            reply = replyData.message;
            console.log("Received reply from Pro-Talk API");
            pollingLogs.push(`${new Date().toISOString()}: Получен ответ: "${reply}"`);
            break;
          } else {
            pollingLogs.push(`${new Date().toISOString()}: Ответ пустой или отсутствует - продолжаем опрос`);
            consecutiveErrors = 0; // Reset error counter on successful response
          }
        } else if (status === 202 || status === 204) {
          // Response not ready yet - continue polling
          pollingLogs.push(`${new Date().toISOString()}: Ответ не готов (${status}) - продолжаем опрос`);
          consecutiveErrors = 0;
        } else if (status === 429) {
          // Rate limiting - increase delay
          pollingLogs.push(`${new Date().toISOString()}: Rate limiting (429) - увеличиваем задержку`);
          consecutiveErrors++;
          await new Promise(resolve => setTimeout(resolve, 5000 + consecutiveErrors * 2000));
        } else if (status >= 500 && status <= 503) {
          // Server errors - retry with backoff
          consecutiveErrors++;
          pollingLogs.push(`${new Date().toISOString()}: Серверная ошибка (${status}) - повтор с экспоненциальной задержкой (ошибки подряд: ${consecutiveErrors})`);
          
          if (consecutiveErrors >= 5) {
            pollingLogs.push(`${new Date().toISOString()}: Слишком много серверных ошибок подряд - прерываем опрос`);
            throw new Error(`Too many consecutive server errors (${consecutiveErrors})`);
          }
        } else if (status === 404 || status === 401 || status === 403) {
          // Critical errors - stop polling
          const errorText = await replyResponse.text();
          pollingLogs.push(`${new Date().toISOString()}: Критическая ошибка (${status}) - прерываем опрос: ${errorText}`);
          throw new Error(`Critical error ${status}: ${errorText}`);
        } else {
          // Other errors - log and continue
          consecutiveErrors++;
          pollingLogs.push(`${new Date().toISOString()}: Неожиданный статус (${status}) - продолжаем опрос (ошибки: ${consecutiveErrors})`);
        }
        
      } catch (pollError) {
        consecutiveErrors++;
        const isNetworkError = pollError.name === 'TypeError' || pollError.message.includes('fetch');
        const errorType = isNetworkError ? 'Сетевая ошибка' : 'Ошибка обработки';
        
        console.warn(`Reply polling attempt ${attempts} failed:`, pollError);
        pollingLogs.push(`${new Date().toISOString()}: ${errorType}: ${pollError.message} (ошибки подряд: ${consecutiveErrors})`);
        
        // More aggressive retry for network errors
        if (isNetworkError && consecutiveErrors >= 3) {
          const networkDelay = Math.min(5000 * consecutiveErrors, 20000);
          pollingLogs.push(`${new Date().toISOString()}: Множественные сетевые ошибки - дополнительная задержка ${networkDelay}мс`);
          await new Promise(resolve => setTimeout(resolve, networkDelay));
        }
        
        if (consecutiveErrors >= 8) {
          pollingLogs.push(`${new Date().toISOString()}: Слишком много ошибок подряд - прерываем опрос`);
          throw new Error(`Too many consecutive errors (${consecutiveErrors}): ${pollError.message}`);
        }
      }
    }
    
    if (reply === '') {
      pollingLogs.push(`${new Date().toISOString()}: Таймаут - ответ не получен за ${maxAttempts} попыток`);
      throw new Error("Timeout waiting for reply from Pro-Talk API");
    }

    pollingLogs.push(`${new Date().toISOString()}: Опрос завершен успешно`);
    
    // Store polling logs globally to be accessible in the main function
    (globalThis as any).pollingLogs = pollingLogs;
    
    return reply;
  } catch (error) {
    console.error("Error in sendToExternalAPI function:", error);
    pollingLogs.push(`${new Date().toISOString()}: Критическая ошибка: ${error.message}`);
    (globalThis as any).pollingLogs = pollingLogs;
    throw error;
  }
}
