import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RuidBotResponse {
  bot_id: number;
  bot_token: string;
  name: string;
}

interface ChatBotResponse {
  id: string;
  bot_id: string;
  name: string;
  bot_token: string;
  token: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ruid } = await req.json();
    
    if (!ruid) {
      return new Response(
        JSON.stringify({ error: 'ruid is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching bots for ruid:', ruid);

    // Call the external API
    const response = await fetch('https://eu1.account.dialog.ai.atiks.org/get_user_bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ruid }),
    });

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bots from external API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const externalBots: RuidBotResponse[] = await response.json();
    console.log('External API response:', externalBots);

    // Transform the response to match our ChatBot format
    const transformedBots: ChatBotResponse[] = externalBots.map(bot => ({
      id: crypto.randomUUID(),
      bot_id: bot.bot_id.toString(),
      name: bot.name,
      bot_token: bot.bot_token,
      token: `ruid:${ruid}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify(transformedBots),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get_ruid_bots:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});