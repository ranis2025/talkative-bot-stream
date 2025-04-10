
import { getSupabaseClient } from "../_shared/db.ts";

// Get all tokens from access_tokens table
export async function getTokens() {
  const supabase = getSupabaseClient();
  const { data: tokens, error: tokensError } = await supabase
    .from('access_tokens')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (tokensError) {
    console.error('Error fetching tokens:', tokensError);
    throw tokensError;
  }
  return tokens;
}

// Get tokens for a specific admin
export async function getAdminTokens(params: { admin_id: string }) {
  const supabase = getSupabaseClient();
  const { admin_id } = params;
  
  console.log(`Getting tokens for admin ID: ${admin_id}`);
  
  // Call the database function to get admin tokens
  const { data: tokens, error: tokensError } = await supabase
    .rpc('get_admin_tokens', { admin_id });
  
  if (tokensError) {
    console.error('Error fetching admin tokens:', tokensError);
    throw tokensError;
  }
  
  return tokens;
}

// Get token value by ID
export async function getTokenValue(params: { token_id: string }) {
  const supabase = getSupabaseClient();
  const { token_id } = params;
  
  console.log(`Getting token value for ID: ${token_id}`);
  
  const { data: token, error: tokenError } = await supabase
    .from('access_tokens')
    .select('token')
    .eq('id', token_id)
    .single();
  
  if (tokenError) {
    console.error('Error fetching token value:', tokenError);
    throw tokenError;
  }
  
  console.log('Token value retrieved:', token);
  return { token: token.token };
}

// Add a new token to access_tokens table
export async function addToken(params: { token: string, name: string, description?: string, admin_id?: string | null }) {
  const supabase = getSupabaseClient();
  const { token: tokenValue, name, description, admin_id } = params;
  
  console.log("Adding token with params:", { tokenValue, name, description, admin_id });
  
  const insertData: any = { 
    token: tokenValue, 
    name, 
    description 
  };
  
  // Only add admin_id if it's provided and not null/undefined
  if (admin_id) {
    console.log("Setting admin_id to:", admin_id);
    insertData.admin_id = admin_id;
  } else {
    console.log("No admin_id provided, setting to null");
    insertData.admin_id = null;
  }
  
  const { data: newToken, error: addError } = await supabase
    .from('access_tokens')
    .insert([insertData])
    .select()
    .single();
  
  if (addError) {
    console.error('Error adding token:', addError);
    throw addError;
  }
  
  console.log("Token successfully added:", newToken);
  return { success: true, id: newToken.id };
}

// Update a token in access_tokens table
export async function updateToken(params: { id: string, name: string, description?: string }) {
  const supabase = getSupabaseClient();
  const { id: updateId, name: updateName, description: updateDesc } = params;
  const { error: updateError } = await supabase
    .from('access_tokens')
    .update({ name: updateName, description: updateDesc, updated_at: new Date().toISOString() })
    .eq('id', updateId);
  
  if (updateError) {
    console.error('Error updating token:', updateError);
    throw updateError;
  }
  return { success: true };
}

// Delete a token from access_tokens table
export async function deleteToken(params: { id: string }) {
  const supabase = getSupabaseClient();
  const { id: deleteId } = params;
  const { error: deleteError } = await supabase
    .from('access_tokens')
    .delete()
    .eq('id', deleteId);
  
  if (deleteError) {
    console.error('Error deleting token:', deleteError);
    throw deleteError;
  }
  return { success: true };
}

// Transfer token ownership to another admin
export async function transferToken(params: { token_id: string, new_admin_id: string }) {
  const supabase = getSupabaseClient();
  const { token_id, new_admin_id } = params;
  
  console.log(`Transferring token ${token_id} to admin ${new_admin_id}`);
  
  // Call the database function to transfer the token
  const { data, error } = await supabase
    .rpc('transfer_token', { token_id, new_admin_id });
  
  if (error) {
    console.error('Error transferring token:', error);
    throw error;
  }
  
  return { success: true };
}

// Function to dispatch token operations based on action type
export function handleTokenOperation(action: string, params: any) {
  console.log(`Handling token operation: ${action}`);
  
  switch (action) {
    case 'token_get_all':
    case 'get_tokens':
      return getTokens();
    case 'token_get_admin':
    case 'get_admin_tokens':
      return getAdminTokens(params);
    case 'token_get_value':
    case 'get_token_value':
      return getTokenValue(params);
    case 'token_add':
    case 'add_token':
      return addToken(params);
    case 'token_update':
    case 'update_token':
      return updateToken(params);
    case 'token_delete':
    case 'delete_token':
      return deleteToken(params);
    case 'token_transfer':
    case 'transfer_token':
      return transferToken(params);
    default:
      throw new Error(`Unknown token action: ${action}`);
  }
}
