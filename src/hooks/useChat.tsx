import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { IChat, IMessage, ApiResponse, Json, ChatBot, UserSettings } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage, sendGroupMessage } from "@/lib/chatApi";

export function useChat() {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();
  const [currentBot, setCurrentBot] = useState<string | null>(null);
  const [userBots, setUserBots] = useState<ChatBot[]>([]);
  const [chatView, setChatView] = useState<'individual' | 'group'>('individual');

  const fetchUserBots = useCallback(async () => {
    if (!token) return;
    
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      
      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching user settings:", settingsError);
      }

      const { data: botsData, error: botsError } = await supabase
        .from("chat_bots")
        .select("*")
        .eq("token", token);
      
      if (botsError) {
        console.error("Error fetching user bots:", botsError);
        return;
      }
      
      if (botsData && botsData.length > 0) {
        setUserBots(botsData as ChatBot[]);
        if (!currentBot) {
          setCurrentBot(botsData[0].bot_id);
        }
      }

      if (settingsData) {
        const settings = settingsData as unknown as UserSettings;
        if (settings.default_bot_id && !currentBot) {
          setCurrentBot(settings.default_bot_id);
        }
      }
    } catch (error) {
      console.error("Error loading user bots and settings:", error);
    }
  }, [token, currentBot]);

  const fetchChats = useCallback(async (bot_id?: string) => {
    if (!token) return;
    
    try {
      let query = supabase
        .from("protalk_chats")
        .select("*");
      
      query = query.eq('token', token);
      
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
  }, [currentChatId, toast, token]);

  useEffect(() => {
    if (token) {
      fetchUserBots();
    }
  }, [fetchUserBots, token]);

  useEffect(() => {
    if (token) {
      fetchChats(currentBot);
    }
  }, [fetchChats, currentBot, token]);

  const createChat = useCallback(async (isGroupChat = false) => {
    if (!token) return;
    
    const newChatId = uuidv4();
    const newChat: IChat = {
      id: newChatId,
      title: isGroupChat ? "Новый групповой чат" : "Новый чат",
      messages: [],
      bot_id: isGroupChat ? null : currentBot,
      bots_ids: isGroupChat ? [] : undefined,
      is_group_chat: isGroupChat,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const { error } = await supabase.from("protalk_chats").insert({
        id: newChatId,
        title: isGroupChat ? "Новый групповой чат" : "Новый чат",
        bot_id: isGroupChat ? null : currentBot,
        bots_ids: isGroupChat ? [] : null,
        is_group_chat: isGroupChat,
        token: token,
        messages: [] as unknown as Json,
      });

      if (error) {
        throw error;
      }

      setChats((prevChats) => [newChat, ...prevChats]);
      setCurrentChatId(newChatId);
      
      if (isGroupChat) {
        setChatView('group');
      } else {
        setChatView('individual');
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый чат",
        variant: "destructive",
      });
    }
  }, [currentBot, toast, token]);

  const createGroupChat = useCallback(() => {
    return createChat(true);
  }, [createChat]);

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!currentChatId || !message.trim()) return;

      setLoading(true);

      try {
        const currentChat = chats.find((chat) => chat.id === currentChatId);
        if (!currentChat) return;

        const userMessage: IMessage = {
          id: uuidv4(),
          content: message,
          role: "user",
          timestamp: Date.now(),
        };

        const updatedMessages = [...currentChat.messages, userMessage];

        const { error: updateError } = await supabase
          .from("protalk_chats")
          .update({ 
            messages: updatedMessages as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentChatId);

        if (updateError) {
          throw updateError;
        }

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

        try {
          if (currentChat.is_group_chat && currentChat.bots_ids && currentChat.bots_ids.length > 0) {
            const botResponses = await sendGroupMessage(currentChatId, message, currentChat.bots_ids);
            
            const botMessages: IMessage[] = botResponses.map(response => {
              const bot = userBots.find(b => b.bot_id === response.botId);
              return {
                id: uuidv4(),
                content: response.response,
                role: "bot",
                timestamp: Date.now(),
                bot_id: response.botId,
                bot_name: bot?.name || "Бот"
              };
            });

            const messagesWithBotResponses = [...updatedMessages, ...botMessages];
            
            const { error: botUpdateError } = await supabase
              .from("protalk_chats")
              .update({ 
                messages: messagesWithBotResponses as unknown as Json,
                updated_at: new Date().toISOString()
              })
              .eq("id", currentChatId);

            if (botUpdateError) {
              throw botUpdateError;
            }

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

              setChats((prevChats) =>
                prevChats.map((chat) =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        title: shortTitle,
                        messages: messagesWithBotResponses,
                        updatedAt: Date.now(),
                      }
                    : chat
                )
              );
            } else {
              setChats((prevChats) =>
                prevChats.map((chat) =>
                  chat.id === currentChatId
                    ? {
                        ...chat,
                        messages: messagesWithBotResponses,
                        updatedAt: Date.now(),
                      }
                    : chat
                )
              );
            }
          } else {
            const botResponse = await sendMessage(currentChatId, message, currentChat.bot_id);
            
            const botMessage: IMessage = {
              id: uuidv4(),
              content: botResponse,
              role: "bot",
              timestamp: Date.now(),
            };

            const messagesWithBotResponse = [...updatedMessages, botMessage];
            
            const { error: botUpdateError } = await supabase
              .from("protalk_chats")
              .update({ 
                messages: messagesWithBotResponse as unknown as Json,
                updated_at: new Date().toISOString()
              })
              .eq("id", currentChatId);

            if (botUpdateError) {
              throw botUpdateError;
            }

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
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          
          const errorMessage: IMessage = {
            id: uuidv4(),
            content: `Ошибка: ${apiError.message || "Не удалось получить ответ от бота."}`,
            role: "bot",
            timestamp: Date.now(),
          };
          
          const messagesWithError = [...updatedMessages, errorMessage];
          
          await supabase
            .from("protalk_chats")
            .update({ 
              messages: messagesWithError as unknown as Json,
              updated_at: new Date().toISOString()
            })
            .eq("id", currentChatId);
            
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: messagesWithError,
                    updatedAt: Date.now(),
                  }
                : chat
            )
          );
          
          toast({
            title: "Ошибка при отправке сообщения",
            description: apiError.message || "Не удалось получить ответ от бота.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in message flow:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить сообщение",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [chats, currentChatId, toast, userBots]
  );

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

        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);

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

  const addBotToGroupChat = useCallback(
    async (botId: string) => {
      if (!currentChatId) return;

      try {
        const currentChat = chats.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.is_group_chat) return;

        const currentBots = currentChat.bots_ids || [];
        if (currentBots.includes(botId)) return;

        const updatedBots = [...currentBots, botId];
        
        const { error } = await supabase
          .from("protalk_chats")
          .update({ 
            bots_ids: updatedBots,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentChatId);

        if (error) {
          throw error;
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  bots_ids: updatedBots,
                  updatedAt: Date.now(),
                }
              : chat
          )
        );

        toast({
          title: "Бот добавлен",
          description: "Бот успешно добавлен в групповой чат",
        });
      } catch (error) {
        console.error("Error adding bot to group chat:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось добавить бота в чат",
          variant: "destructive",
        });
      }
    },
    [chats, currentChatId, toast]
  );

  const removeBotFromGroupChat = useCallback(
    async (botId: string) => {
      if (!currentChatId) return;

      try {
        const currentChat = chats.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.is_group_chat) return;

        const currentBots = currentChat.bots_ids || [];
        const updatedBots = currentBots.filter(id => id !== botId);
        
        const { error } = await supabase
          .from("protalk_chats")
          .update({ 
            bots_ids: updatedBots,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentChatId);

        if (error) {
          throw error;
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  bots_ids: updatedBots,
                  updatedAt: Date.now(),
                }
              : chat
          )
        );
      } catch (error) {
        console.error("Error removing bot from group chat:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить бота из чата",
          variant: "destructive",
        });
      }
    },
    [chats, currentChatId, toast]
  );

  const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

  const setCurrentBotId = useCallback((botId: string | null) => {
    setCurrentBot(botId);
    setCurrentChatId(null);
  }, []);

  const switchChatView = useCallback((view: 'individual' | 'group') => {
    setChatView(view);
    setCurrentChatId(null);
  }, []);

  return {
    chats,
    currentChat,
    currentChatId,
    loading,
    isInitialized,
    setCurrentChatId,
    createChat,
    createGroupChat,
    sendChatMessage,
    deleteChat,
    renameChat,
    currentBot,
    setCurrentBotId,
    userBots,
    chatView,
    switchChatView,
    addBotToGroupChat,
    removeBotFromGroupChat
  };
}
