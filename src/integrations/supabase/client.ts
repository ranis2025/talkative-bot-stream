import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Конфигурация
const baseId = 'isxqxbysfsdyhmjcxfsm';
const proxyBaseUrl = `https://kz.proxy.atiks.org/supabase/${baseId}`;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeHF4YnlzZnNkeWhtamN4ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTUzNjUsImV4cCI6MjA1ODIzMTM2NX0.OSmh005slZWbm1BwEPsDDYKzkjwZgPs4q4VoRLXs0H0';

// Инициализация клиента с улучшенными настройками
export const supabase = createClient<Database>(proxyBaseUrl, supabaseKey, {
  functions: {
    timeout: 300000, // 5 минут (макс. допустимое значение)
  },
  global: {
    fetch: (...args) => fetch(...args, { keepalive: true }), // Предотвращает обрыв неактивных соединений
  },
});

/**
 * Безопасный вызов Edge Function с ретраями и обработкой ошибок
 * @param fnName Название функции (например: "process-data")
 * @param body Тело запроса (опционально)
 * @param retries Макс. количество попыток (по умолчанию 3)
 * @param initialDelay Начальная задержка между попытками в мс (по умолчанию 1000)
 */
export async function callEdgeFunction<T = any>(
  fnName: string,
  body?: object,
  retries = 3,
  initialDelay = 1000
): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body });

    if (error) {
      console.error(`Supabase Function "${fnName}" error:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    if (retries <= 0) {
      console.error(`All retries failed for "${fnName}":`, error);
      throw new Error(`Failed after 3 attempts: ${error.message}`);
    }

    const delay = initialDelay * 2 ** (3 - retries); // Экспоненциальная задержка
    console.warn(`Retrying "${fnName}" in ${delay}ms... (${retries} left)`);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return callEdgeFunction<T>(fnName, body, retries - 1, initialDelay);
  }
}

// Пример использования:
// const result = await callEdgeFunction<{ status: string }>("process-data", { input: "test" });