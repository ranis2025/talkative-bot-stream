
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
}

interface RequestStats {
  attempt: number;
  totalTime: number;
  lastError?: any;
}

// Функция для определения, стоит ли повторять запрос
function shouldRetry(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code;
  
  // Повторяем при сетевых ошибках и таймаутах
  const networkErrors = [
    'network error',
    'fetch error',
    'timeout',
    'connection',
    'failed to fetch',
    'request timeout',
    'server took too long'
  ];
  
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
  
  return networkErrors.some(err => errorMessage.includes(err)) || 
         retryableCodes.includes(errorCode);
}

// Функция для расчета задержки с экспоненциальным backoff
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Добавляем случайность
  return Math.min(exponentialDelay + jitter, maxDelay);
}

// Главная функция retry с детальным логированием
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = shouldRetry
  } = options;

  const stats: RequestStats = { attempt: 0, totalTime: 0 };
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    stats.attempt = attempt;
    
    try {
      console.log(`[Supabase Retry] Attempt ${attempt}/${maxRetries + 1}`);
      const result = await operation();
      
      stats.totalTime = Date.now() - startTime;
      console.log(`[Supabase Retry] Success on attempt ${attempt}, total time: ${stats.totalTime}ms`);
      
      if (attempt > 1) {
        toast({
          title: "Подключение восстановлено",
          description: `Запрос выполнен успешно с ${attempt} попытки`,
        });
      }
      
      return result;
    } catch (error) {
      stats.lastError = error;
      stats.totalTime = Date.now() - startTime;
      
      console.error(`[Supabase Retry] Attempt ${attempt} failed:`, error);
      
      // Если это последняя попытка или ошибка не подлежит retry
      if (attempt > maxRetries || !retryCondition(error)) {
        console.error(`[Supabase Retry] All attempts failed. Total time: ${stats.totalTime}ms`);
        throw error;
      }
      
      // Вычисляем задержку и показываем уведомление
      const delay = calculateDelay(attempt, baseDelay, maxDelay);
      console.log(`[Supabase Retry] Retrying in ${delay}ms...`);
      
      if (attempt === 1) {
        toast({
          title: "Проблемы с подключением",
          description: "Пытаемся переподключиться...",
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw stats.lastError;
}

// Специальная обертка для вызова Edge функций
export async function invokeEdgeFunction(
  functionName: string, 
  body: any,
  options: RetryOptions = {}
): Promise<any> {
  return withRetry(async () => {
    console.log(`[Edge Function] Calling ${functionName} with body:`, body);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });
    
    if (error) {
      console.error(`[Edge Function] ${functionName} error:`, error);
      throw error;
    }
    
    console.log(`[Edge Function] ${functionName} success:`, data);
    return data;
  }, {
    maxRetries: 2, // Для Edge функций делаем меньше попыток
    baseDelay: 2000, // Больше задержка между попытками
    maxDelay: 8000,
    ...options
  });
}

// Обертка для обычных запросов к базе данных
export async function queryWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  return withRetry(async () => {
    const result = await operation();
    
    if (result.error && shouldRetry(result.error)) {
      throw result.error;
    }
    
    return result;
  }, options);
}
