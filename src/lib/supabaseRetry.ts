import { supabase } from "@/integrations/supabase/client";

/**
 * Retry wrapper for Supabase functions with exponential backoff
 */
export async function invokeWithRetry<T>(
  functionName: string,
  payload: any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} for function ${functionName}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        timeout: 120000 // 2 minutes
      });

      if (error) {
        // Check if it's a timeout or network error that we should retry
        if (isRetryableError(error) && attempt < maxRetries) {
          console.warn(`Retryable error on attempt ${attempt + 1}:`, error.message);
          lastError = new Error(error.message);
          
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(error.message);
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a timeout or network error that we should retry
      if (isRetryableError(lastError) && attempt < maxRetries) {
        console.warn(`Retryable error on attempt ${attempt + 1}:`, lastError.message);
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or not retryable, throw the error
      throw lastError;
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('failed to send a request') ||
    errorMessage.includes('edge function returned a non-2xx status code') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('request failed') ||
    errorMessage.includes('network request failed') ||
    errorMessage.includes('unable to reach') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('internal server error')
  );
}