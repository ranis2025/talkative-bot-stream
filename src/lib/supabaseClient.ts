import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const baseId = 'isxqxbysfsdyhmjcxfsm';
const proxyBaseUrl = `https://kz.proxy.atiks.org/supabase/${baseId}`;

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeHF4YnlzZnNkeWhtamN4ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTUzNjUsImV4cCI6MjA1ODIzMTM2NX0.OSmh005slZWbm1BwEPsDDYKzkjwZgPs4q4VoRLXs0H0';

// Создаем отдельный клиент с увеличенными таймаутами для функций
export const supabaseWithTimeout = createClient<Database>(proxyBaseUrl, supabaseKey);

// Переопределяем метод invoke для функций с кастомным таймаутом
const originalInvoke = supabaseWithTimeout.functions.invoke;
supabaseWithTimeout.functions.invoke = async function(functionName: string, options: any = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 минуты
  
  try {
    const result = await originalInvoke.call(this, functionName, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Function call timed out after 3 minutes');
    }
    throw error;
  }
};

export { supabaseWithTimeout as supabase };