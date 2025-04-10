
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
export async function addToken(params: { token: string, name: string, description?: string, admin_id?: string }) {
  const supabase = getSupabaseClient();
  const { token: tokenValue, name, description, admin_id } = params;
  
  const insertData: any = { 
    token: tokenValue, 
    name, 
    description 
  };
  
  // Only add admin_id if it's provided and not null/undefined
  if (admin_id) {
    insertData.admin_id = admin_id;
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
