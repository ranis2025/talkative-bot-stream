
import { getSupabaseClient } from "../_shared/db.ts";

// Get all token-bot assignments
export async function getAllAssignments() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('token_bot_assignments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching token-bot assignments:', error);
    throw error;
  }
  
  return data;
}

// Add a new token-bot assignment
export async function addAssignment(params: { token_id: string; bot_id: string; bot_name?: string; bot_token?: string }) {
  const supabase = getSupabaseClient();
  const { token_id, bot_id, bot_name, bot_token } = params;
  
  const { error } = await supabase
    .from('token_bot_assignments')
    .insert([{ token_id, bot_id, bot_name, bot_token }]);
  
  if (error) {
    console.error('Error adding token-bot assignment:', error);
    throw error;
  }
  
  return { success: true };
}

// Remove a token-bot assignment
export async function removeAssignment(params: { id: string }) {
  const supabase = getSupabaseClient();
  const { id } = params;
  
  const { error } = await supabase
    .from('token_bot_assignments')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error removing token-bot assignment:', error);
    throw error;
  }
  
  return { success: true };
}

// Handle assignment operations based on action type
export function handleAssignmentOperation(action: string, params: any) {
  console.log(`Handling assignment operation: ${action} with params:`, params);
  
  switch (action) {
    case 'assignment_get_all':
      return getAllAssignments();
    case 'assignment_add':
      return addAssignment(params);
    case 'assignment_remove':
      return removeAssignment(params);
    default:
      throw new Error(`Unknown assignment action: ${action}`);
  }
}
