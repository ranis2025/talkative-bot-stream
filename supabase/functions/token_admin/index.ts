import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'get_bots_by_token') {
      const { token_value } = await req.json();
      console.log('Getting bots for token:', token_value);

      try {
        // First get the token ID from the access_tokens table
        const { data: tokenData, error: tokenError } = await supabaseClient
          .from('access_tokens')
          .select('id')
          .eq('token', token_value)
          .maybeSingle();

        if (tokenError) {
          console.error('Error fetching token:', tokenError);
          throw tokenError;
        }

        if (!tokenData) {
          console.log('Token not found:', token_value);
          return new Response(
            JSON.stringify({ bots: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Found token ID:', tokenData.id);

        // Now get the bot assignments for this token
        const { data: assignments, error: assignmentsError } = await supabaseClient
          .from('token_bot_assignments')
          .select('*')
          .eq('token_id', tokenData.id);

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          throw assignmentsError;
        }

        console.log('Found assignments:', assignments?.length || 0);

        // Get bot data from chat_bots table for additional info if available
        if (assignments && assignments.length > 0) {
          const botIds = assignments.map(a => a.bot_id);
          const { data: botData, error: botError } = await supabaseClient
            .from('chat_bots')
            .select('bot_id, name')
            .in('bot_id', botIds);

          if (botError) {
            console.error('Error fetching bot details:', botError);
          }

          // Create a map of bot_id to name for easy lookup
          const botNames = new Map();
          if (botData) {
            botData.forEach(bot => {
              botNames.set(bot.bot_id, bot.name);
            });
          }

          // Enrich assignments with bot names and make sure token_id is included
          const enrichedAssignments = assignments.map(assignment => ({
            id: assignment.id,
            bot_id: assignment.bot_id,
            bot_token: assignment.bot_token,
            bot_name: botNames.get(assignment.bot_id) || null,
            token_id: tokenData.id // Ensure token_id is included in each bot assignment
          }));

          console.log('Returning enriched assignments with names and token_id');
          return new Response(
            JSON.stringify(enrichedAssignments),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(assignments ? assignments.map(a => ({...a, token_id: tokenData.id})) : []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error in get_bots_by_token:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
