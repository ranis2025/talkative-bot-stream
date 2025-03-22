
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { IChat, IMessage, ApiResponse } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function useChat() {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentBot, setCurrentBot] = useState<string | null>(null);
  const [userBots, setUserBots] = useState<any[]>([]);

  // Fetch user's bots
  const fetchUserBots = useCallback(async () => {
    if (!user) return;
    
    try {
      // First check if user has custom settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (settingsError && settingsError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error
        console.error("Error fetching user settings:", settingsError);
      }

      // Fetch bots assigned to this user
      const { data: botsData, error: botsError } = await supabase
        .from("chat_bots")
        .select("*")
        .eq("user_id", user.id);
      
      if (botsError) {
        console.error("Error fetching user bots:", botsError);
        return;
      }
      
      // If we have bots, set them and default to the first one
      if (botsData && botsData.length > 0) {
        setUserBots(botsData);
        if (!currentBot) {
          setCurrentBot(botsData[0].bot_id);
        }
      }

      // Apply any user settings
      if (settingsData) {
        // If there's a default bot in settings, use it
        if (settingsData.default_bot_id && !currentBot) {
          setCurrentBot(settingsData.default_bot_id);
        }
      }
    } catch (error) {
      console.error("Error loading user bots and settings:", error);
    }
  }, [user, currentBot]);

  // Получаем все чаты из базы данных
  const fetchChats = useCallback(async (bot_id?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from("protalk_chats")
        .select("*");
      
      if (bot_id) {
        query = query.eq('bot_id', bot_id);
      }
      
      const { data, error } = await query.order("updated_at", { ascending: false });
      
      if (error) {
        throw error;
      }

      if (data) {
        const formattedChats: IChat[] = data.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          messages: chat.messages as IMessage[],
          bot_id: chat.bot_id || null,
          createdAt: chat.created_at ? new Date(chat.created_at).getTime() : Date.now(),
          updatedAt: chat.updated_at ? new Date(chat.updated_at).getTime() : Date.now(),
        }));

        setChats(formattedChats);

        // Если нет текущего чата, устанавливаем первый чат как текущий
        if (formattedChats.length > 0 && !currentChatId) {
          setCurrentChatId(formattedChats[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чаты",
        variant: "destructive",
      });
    } finally {
      setIsInitialized(true);
    }
  }, [currentChatId, toast, user]);

  // Load user bots and settings when user changes
  useEffect(() => {
    if (user) {
      fetchUserBots();
    }
  }, [fetchUserBots, user]);

  // Устанавливаем бота и загружаем чаты при изменении 
  useEffect(() => {
    if (user) {
      fetchChats(currentBot);
    }
  }, [fetchChats, currentBot, user]);

  // Создаем новый чат
  const createChat = useCallback(async () => {
    const newChatId = uuidv4();
    const newChat: IChat = {
      id: newChatId,
      title: "Новый чат",
      messages: [],
      bot_id: currentBot,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const { error } = await supabase.from("protalk_chats").insert({
        id: newChatId,
        title: "Новый чат",
        bot_id: currentBot,
        messages: [],
      });

      if (error) {
        throw error;
      }

      setChats((prevChats) => [newChat, ...prevChats]);
      setCurrentChatId(newChatId);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый чат",
        variant: "destructive",
      });
    }
  }, [currentBot, toast]);

  // Отправляем сообщение в чат
  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!currentChatId || !message.trim()) return;

      setLoading(true);

      try {
        // Находим текущий чат
        const currentChat = chats.find((chat) => chat.id === currentChatId);
        if (!currentChat) return;

        // Создаем новое сообщение пользователя
        const userMessage: IMessage = {
          id: uuidv4(),
          content: message,
          role: "user",
          timestamp: Date.now(),
        };

        // Обновляем список сообщений чата
        const updatedMessages = [...currentChat.messages, userMessage];

        // Сохраняем сообщение пользователя в базу данных
        const { error: updateError } = await supabase
          .from("protalk_chats")
          .update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentChatId);

        if (updateError) {
          throw updateError;
        }

        // Обновляем список чатов
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                }
              : chat
          )
        );

        // Отправляем запрос к API для получения ответа от бота
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bot_id: currentChat.bot_id,
            chat_id: currentChatId,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response from API");
        }

        const data: ApiResponse = await response.json();

        if (!data.ok) {
          throw new Error(data.done || "Unknown error");
        }

        // Создаем новое сообщение от бота
        const botMessage: IMessage = {
          id: uuidv4(),
          content: data.done,
          role: "bot",
          timestamp: Date.now(),
        };

        // Обновляем список сообщений чата
        const messagesWithBotResponse = [...updatedMessages, botMessage];

        // Сохраняем ответ бота в базу данных
        const { error: botUpdateError } = await supabase
          .from("protalk_chats")
          .update({ 
            messages: messagesWithBotResponse,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentChatId);

        if (botUpdateError) {
          throw botUpdateError;
        }

        // Если это первое сообщение, обновляем заголовок чата
        if (currentChat.messages.length === 0) {
          const shortTitle =
            message.length > 30 ? message.substring(0, 30) + "..." : message;

          const { error: titleError } = await supabase
            .from("protalk_chats")
            .update({ title: shortTitle })
            .eq("id", currentChatId);

          if (titleError) {
            throw titleError;
          }

          // Обновляем список чатов с новым заголовком
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    title: shortTitle,
                    messages: messagesWithBotResponse,
                    updatedAt: Date.now(),
                  }
                : chat
            )
          );
        } else {
          // Обновляем список чатов
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: messagesWithBotResponse,
                    updatedAt: Date.now(),
                  }
                : chat
            )
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить сообщение",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [chats, currentChatId, toast]
  );

  // Удаляем чат
  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const { error } = await supabase
          .from("protalk_chats")
          .delete()
          .eq("id", chatId);

        if (error) {
          throw error;
        }

        // Обновляем список чатов
        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);

        // Если удаляемый чат был текущим, устанавливаем первый чат из списка как текущий
        if (chatId === currentChatId) {
          setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить чат",
          variant: "destructive",
        });
      }
    },
    [chats, currentChatId, toast]
  );

  // Переименовываем чат
  const renameChat = useCallback(
    async (chatId: string, newTitle: string) => {
      try {
        const { error } = await supabase
          .from("protalk_chats")
          .update({ title: newTitle })
          .eq("id", chatId);

        if (error) {
          throw error;
        }

        // Обновляем список чатов
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          )
        );
      } catch (error) {
        console.error("Error renaming chat:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось переименовать чат",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Находим текущий чат
  const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

  // Устанавливаем текущего бота
  const setCurrentBotId = useCallback((botId: string | null) => {
    setCurrentBot(botId);
    setCurrentChatId(null); // Сбрасываем текущий чат при смене бота
  }, []);

  return {
    chats,
    currentChat,
    currentChatId,
    loading,
    isInitialized,
    setCurrentChatId,
    createChat,
    sendChatMessage,
    deleteChat,
    renameChat,
    currentBot,
    setCurrentBotId,
    userBots
  };
}
