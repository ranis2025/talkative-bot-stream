
import { supabase } from "@/integrations/supabase/client";
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from "@/types/user";
import { v4 as uuidv4 } from "uuid";

// Хеширование пароля (в реальном приложении используйте более безопасные методы)
const hashPassword = async (password: string): Promise<string> => {
  // В реальном приложении используйте bcrypt или аналогичную библиотеку
  // Здесь просто демонстрационная реализация
  return password + "_hashed";
};

// Проверка пароля
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // В реальном приложении используйте bcrypt.compare или аналог
  return hashedPassword === password + "_hashed";
};

// Регистрация пользователя
export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    // Проверяем, существует ли пользователь с таким именем
    const { data: existingUser, error: checkError } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", credentials.username)
      .maybeSingle();

    if (existingUser) {
      return {
        success: false,
        message: "Пользователь с таким именем уже существует"
      };
    }

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(credentials.password);
    
    // Создаем нового пользователя
    const { data: newUser, error: createError } = await supabase
      .from("app_users")
      .insert({
        username: credentials.username,
        password: hashedPassword,
        email: credentials.email
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Генерируем токен для пользователя
    const token = `${credentials.username}:${uuidv4()}`;
    
    // Создаем настройки пользователя с новым токеном
    const { error: settingsError } = await supabase
      .from("user_settings")
      .insert({
        token: token,
        app_user_id: newUser.id,
        user_id: uuidv4(),
        theme: 'dark'
      });

    if (settingsError) {
      throw settingsError;
    }

    const user: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: new Date(newUser.created_at),
      updatedAt: new Date(newUser.updated_at)
    };

    return {
      success: true,
      token,
      user
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "Ошибка при регистрации: " + (error.message || "Неизвестная ошибка")
    };
  }
}

// Вход пользователя
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Ищем пользователя по имени
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", credentials.username)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (!user) {
      return {
        success: false,
        message: "Пользователь не найден"
      };
    }

    // Проверяем пароль
    const isPasswordValid = await verifyPassword(credentials.password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Неверный пароль"
      };
    }

    // Получаем или создаем токен для пользователя
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("app_user_id", user.id)
      .maybeSingle();

    let token;
    
    if (settings) {
      token = settings.token;
    } else {
      // Если настройки не найдены, создаем новые
      token = `${credentials.username}:${uuidv4()}`;
      
      const { error: createSettingsError } = await supabase
        .from("user_settings")
        .insert({
          token,
          app_user_id: user.id,
          user_id: uuidv4(),
          theme: 'dark'
        });
        
      if (createSettingsError) {
        throw createSettingsError;
      }
    }

    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };

    return {
      success: true,
      token,
      user: userData
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Ошибка при входе: " + (error.message || "Неизвестная ошибка")
    };
  }
}

// Получение пользователя по токену
export async function getUserByToken(token: string): Promise<User | null> {
  try {
    // Сначала получаем settings по токену
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("app_user_id")
      .eq("token", token)
      .maybeSingle();

    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError;
    }

    if (!settings || !settings.app_user_id) {
      return null;
    }

    // Затем получаем данные пользователя
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", settings.app_user_id)
      .single();

    if (userError) {
      throw userError;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  } catch (error) {
    console.error("Error getting user by token:", error);
    return null;
  }
}

// Обновление настроек пользователя (например, темы)
export async function updateUserSettings(token: string, settings: { theme?: string }): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_settings")
      .update(settings)
      .eq("token", token);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error updating user settings:", error);
    return false;
  }
}

// Создание бота для определенного пользователя
export async function createBot(token: string, botName: string, botId: string, botToken?: string, openaiKey?: string): Promise<boolean> {
  try {
    // Получаем пользователя по токену
    const user = await getUserByToken(token);
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Создаем бота
    const { error } = await supabase
      .from("chat_bots")
      .insert({
        name: botName,
        bot_id: botId,
        token: token,
        app_user_id: user.id,
        bot_token: botToken,
        openai_key: openaiKey
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error creating bot:", error);
    return false;
  }
}

// Получение ботов пользователя
export async function getUserBots(token: string) {
  try {
    const user = await getUserByToken(token);
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const { data, error } = await supabase
      .from("chat_bots")
      .select("*")
      .eq("app_user_id", user.id);

    if (error) {
      throw error;
    }

    return { success: true, bots: data };
  } catch (error) {
    console.error("Error getting user bots:", error);
    return { success: false, message: "Ошибка при получении ботов: " + (error.message || "Неизвестная ошибка") };
  }
}
