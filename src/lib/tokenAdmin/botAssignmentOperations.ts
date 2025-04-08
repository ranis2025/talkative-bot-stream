
import { AssignedBot } from "./types";
import { invokeTokenAdminFunction } from "./api";

/**
 * Fetch all bot assignments from the database
 */
export const getAssignedBots = async (): Promise<AssignedBot[]> => {
  try {
    console.log('Fetching assigned bots from edge function');
    return await invokeTokenAdminFunction<AssignedBot[]>('get_assigned_bots');
  } catch (error) {
    console.error('Error getting assigned bots:', error);
    throw error;
  }
};

/**
 * Assign a bot to a token
 */
export const assignBotToToken = async (
  tokenId: string, 
  botId: string, 
  botToken: string, 
  botName: string
): Promise<{ id: string, bot_id: string, bot_name: string }> => {
  try {
    console.log('Assigning bot to token via edge function:', { tokenId, botId, botToken, botName });
    
    // First, find the token's value to use in chat_bots table
    const tokenData = await invokeTokenAdminFunction<{ token: string | null }>('get_token_value', { token_id: tokenId });
    console.log('Token data retrieved:', tokenData);
    
    const data = await invokeTokenAdminFunction<{ 
      id: string, 
      bot_id: string, 
      bot_name: string,
      bot_token?: string,
      token_value?: string
    }>('assign_bot_to_token', { 
      token_id: tokenId, 
      bot_id: botId, 
      bot_token: botToken, 
      bot_name: botName,
      token_value: tokenData.token
    });
    
    console.log('Response from assign_bot_to_token function:', data);
    
    if (!data || !data.id) {
      throw new Error('No data returned from assign_bot_to_token function');
    }
    
    return {
      id: data.id,
      bot_id: data.bot_id,
      bot_name: data.bot_name
    };
  } catch (error) {
    console.error('Error assigning bot to token:', error);
    throw error;
  }
};

/**
 * Remove a bot assignment
 */
export const removeAssignment = async (id: string): Promise<void> => {
  try {
    console.log('Removing assignment via edge function:', { id });
    await invokeTokenAdminFunction('remove_assignment', { id });
  } catch (error) {
    console.error('Error removing assignment:', error);
    throw error;
  }
};
