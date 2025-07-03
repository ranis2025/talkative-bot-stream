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
      console.log("Get reply request body:", JSON.stringify(reqBody));
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

    const { reply_id, bot_id } = reqBody;
    
    if (!reply_id || !bot_id) {
      console.error("Missing required parameters:", { reply_id, bot_id });
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Missing required parameters: reply_id or bot_id" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Polling for reply - bot_id: ${bot_id}, reply_id: ${reply_id}`);

    try {
      // Call ProTalk replica_get_reply endpoint
      const numericBotId = parseInt(bot_id);
      if (isNaN(numericBotId)) {
        throw new Error("Invalid bot_id: must be convertible to an integer");
      }
      
      const apiUrl = `${API_BASE_URL}/replica_get_reply`;
      console.log(`Polling ProTalk API: ${apiUrl}`);
      
      const payload = {
        promt_id: bot_id, // Use bot_id as promt_id as specified
        message: {
          chat: {
            id: reply_id
          }
        }
      };
      
      console.log(`ProTalk polling payload: ${JSON.stringify(payload)}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`ProTalk polling response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ProTalk API error: ${response.status} - ${errorText.substring(0, 200)}`);
        
        // If the reply is not ready yet, return pending status instead of error
        if (response.status === 404 || errorText.includes("not found") || errorText.includes("pending")) {
          return new Response(
            JSON.stringify({ 
              ok: true, 
              ready: false,
              message: "Reply not ready yet, continue polling"
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        throw new Error(`ProTalk API returned status ${response.status}: ${errorText.substring(0, 200)}`);
      }

      // Try to parse the response
      let responseData;
      const responseText = await response.text();
      console.log(`ProTalk polling response body (first 200 chars): ${responseText.substring(0, 200)}`);
      
      try {
        responseData = JSON.parse(responseText);
        console.log("Successfully parsed ProTalk polling response");
      } catch (parseError) {
        console.error("Error parsing ProTalk polling response:", parseError);
        throw new Error(`Failed to parse API response as JSON. Raw response: ${responseText.substring(0, 200)}`);
      }

      // Check if the response contains the message
      if (responseData && responseData.message) {
        console.log("Reply is ready!");
        return new Response(
          JSON.stringify({ 
            ok: true, 
            ready: true,
            message: responseData.message
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      } else {
        // Reply not ready yet
        console.log("Reply not ready yet, message field empty or missing");
        return new Response(
          JSON.stringify({ 
            ok: true, 
            ready: false,
            message: "Reply not ready yet, continue polling"
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } catch (error) {
      console.error("Error polling for reply from ProTalk API:", error);
      
      // Don't return errors for polling failures, just indicate not ready
      return new Response(
        JSON.stringify({ 
          ok: true, 
          ready: false,
          message: "Polling error, will retry"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in get-reply function:", error);
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