import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { IChat, IMessage, ApiResponse, Json, ChatBot, UserSettings, IFile } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage, sendGroupMessage, uploadFiles } from "@/lib/chatApi";

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
      console.log("Fetching bots for token:", token);
      
      // First, get the token ID from access_tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from("access_tokens")
        .select("id")
        .eq("token", token as any)
        .maybeSingle();
      
      if (tokenError && tokenError.code !== "PGRST116") {
        console.error("Error fetching token:", tokenError);
        return;
      }

      let assignedBots: ChatBot[] = [];
      
      // Get bots from token_bot_assignments if we have a token ID
      if (tokenData && 'id' in tokenData && tokenData.id) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("token_bot_assignments")
          .select("*")
          .eq("token_id", tokenData.id);
        
        if (!assignmentsError && assignmentsData) {
          assignedBots = assignmentsData.map(assignment => ({
            id: uuidv4(),
            bot_id: String(assignment && 'bot_id' in assignment ? assignment.bot_id : ''),
            name: String(assignment && 'bot_name' in assignment ? assignment.bot_name || "Bot" : "Bot"),
            bot_token: String(assignment && 'bot_token' in assignment ? assignment.bot_token || '' : ''),
            token: token,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
        }
      }

      // Also get bots from chat_bots as fallback
      const { data: directBotsData, error: directBotsError } = await supabase
        .from("chat_bots")
        .select("*")
        .eq("token", token as any);
      
      if (directBotsError) {
        console.error("Error fetching direct bots:", directBotsError);
      }
      
      const directBots = directBotsData || [];
      
      // Merge and deduplicate bots by bot_id
      const allBots: ChatBot[] = [];
      const botIds = new Set<string>();
      
      // First add assigned bots from token_bot_assignments
      assignedBots.forEach(bot => {
        if (!botIds.has(bot.bot_id)) {
          allBots.push(bot);
          botIds.add(bot.bot_id);
        }
      });
      
      // Then add direct bots if they don't exist yet
      directBots.forEach(bot => {
        if (bot && 'bot_id' in bot && !botIds.has(String(bot.bot_id))) {
          allBots.push(bot as any);
          botIds.add(String(bot.bot_id));
        }
      });
      
      console.log("All bots after merging:", allBots);
      
      if (allBots.length > 0) {
        setUserBots(allBots);
        if (!currentBot) {
          setCurrentBot(allBots[0].bot_id);
        }
      }

      // Set default bot if configured in user settings
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("*")
        .eq("token", token as any)
        .maybeSingle();

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
      
      query = query.eq('token', token as any);
      
      if (chatView === 'group') {
        query = query.eq('is_group_chat', true as any);
      } else if (bot_id) {
        query = query.eq('bot_id', bot_id as any).eq('is_group_chat', false as any);
      } else {
        query = query.eq('is_group_chat', false as any);
      }
      
      const { data, error } = await query.order("updated_at", { ascending: false });
      
      if (error) {
        throw error;
      }

      if (data) {
        console.log("Fetched chats:", data);
        const formattedChats: IChat[] = data.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          messages: chat.messages as IMessage[],
          bot_id: chat.bot_id || null,
          bots_ids: chat.bots_ids || [],
          is_group_chat: chat.is_group_chat || false,
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
  }, [currentChatId, toast, token, chatView]);

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
    if (!token) return null;
    
    try {
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

      console.log("Creating new chat with data:", {
        id: newChatId,
        title: isGroupChat ? "Новый групповой чат" : "Новый чат",
        bot_id: isGroupChat ? null : currentBot,
        bots_ids: isGroupChat ? [] : null,
        is_group_chat: isGroupChat,
        token: token,
        messages: [] as unknown as Json,
      });

      const { error } = await supabase.from("protalk_chats").insert({
        id: newChatId,
        title: isGroupChat ? "Новый групповой чат" : "Новый чат",
        bot_id: isGroupChat ? null : currentBot,
        bots_ids: isGroupChat ? [] : null,
        is_group_chat: isGroupChat,
        token: token,
        messages: [] as unknown as Json,
      } as any);

      if (error) {
        console.error("Error creating chat in Supabase:", error);
        throw error;
      }

      // Fetch the chat we just created to confirm it was saved correctly
      const { data: createdChat, error: fetchError } = await supabase
        .from("protalk_chats")
        .select("*")
        .eq("id", newChatId as any)
        .single();
        
      if (fetchError) {
        console.error("Error fetching newly created chat:", fetchError);
      } else {
        console.log("Created chat retrieved from database:", createdChat);
      }

      setChats((prevChats) => [newChat, ...prevChats]);
      
      if (isGroupChat) {
        setChatView('group');
      } else {
        setChatView('individual');
      }
      
      console.log(`New ${isGroupChat ? 'group' : ''} chat created with ID:`, newChatId);
      return newChatId; // Return the new chat ID
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось создать новый ${isGroupChat ? 'групповой' : ''} чат`,
        variant: "destructive",
      });
      return null;
    }
  }, [currentBot, toast, token]);

  const createGroupChat = useCallback(() => {
    return createChat(true);
  }, [createChat]);

  const sendChatMessage = useCallback(
    async (message: string, files?: IFile[], specificBotId?: string | null) => {
      if (!currentChatId) return;

      setLoading(true);

      try {
        const currentChat = chats.find((chat) => chat.id === currentChatId);
        if (!currentChat) {
          console.error("Chat not found:", currentChatId);
          return;
        }

        let uploadedFiles: IFile[] = [];
        if (files && files.length > 0) {
          try {
            const filesToUpload = files
              .filter(f => f.file instanceof File)
              .map(f => f.file as File);
            
            if (filesToUpload.length > 0) {
              uploadedFiles = await uploadFiles(filesToUpload);
            } else {
              uploadedFiles = files;
            }

            console.log("Files uploaded successfully:", uploadedFiles);
          } catch (uploadError) {
            console.error("Error uploading files:", uploadError);
            toast({
              title: "Ошибка загрузки файлов",
              description: "Не удалось загрузить файлы. Попробуйте снова.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        const userMessage: IMessage = {
          id: uuidv4(),
          content: message,
          role: "user",
          timestamp: Date.now(),
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        };

        const updatedMessages = [...currentChat.messages, userMessage];

        const { error: updateError } = await supabase
          .from("protalk_chats")
          .update({ 
            messages: updatedMessages as unknown as Json,
            updated_at: new Date().toISOString()
          } as any)
          .eq("id", currentChatId as any);

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
            console.log("Processing group chat message for bots:", currentChat.bots_ids);
            console.log("Specific bot ID for first response:", specificBotId);
            
            const botResponses = await sendGroupMessage(
              currentChatId, 
              message, 
              currentChat.bots_ids, 
              uploadedFiles,
              specificBotId
            );
            
            console.log("Received bot responses:", botResponses);
            
            // Create a message for each bot response
            const botMessages: IMessage[] = botResponses.map(response => {
              return {
                id: uuidv4(),
                content: response.response,
                role: "bot",
                timestamp: Date.now(),
                bot_id: response.botId,
                bot_name: response.botName
              };
            });

            const messagesWithBotResponses = [...updatedMessages, ...botMessages];
            
            const { error: botUpdateError } = await supabase
              .from("protalk_chats")
              .update({ 
                messages: messagesWithBotResponses as unknown as Json,
                updated_at: new Date().toISOString()
              } as any)
              .eq("id", currentChatId as any);

            if (botUpdateError) {
              console.error("Error updating chat with bot responses:", botUpdateError);
              throw botUpdateError;
            }

            if (currentChat.messages.length === 0) {
              const shortTitle =
                message.length > 30 ? message.substring(0, 30) + "..." : message;

              const { error: titleError } = await supabase
                .from("protalk_chats")
                .update({ title: shortTitle } as any)
                .eq("id", currentChatId as any);

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
            const botResponse = await sendMessage(currentChatId, message, uploadedFiles, currentChat.bot_id);
            
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
              } as any)
              .eq("id", currentChatId as any);

            if (botUpdateError) {
              throw botUpdateError;
            }

            if (currentChat.messages.length === 0) {
              const shortTitle =
                message.length > 30 ? message.substring(0, 30) + "..." : message;

              const { error: titleError } = await supabase
                .from("protalk_chats")
                .update({ title: shortTitle } as any)
                .eq("id", currentChatId as any);

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
            } as any)
            .eq("id", currentChatId as any);
            
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
    [chats, currentChatId, toast]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const { error } = await supabase
          .from("protalk_chats")
          .delete()
          .eq("id", chatId as any);

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
          .update({ title: newTitle } as any)
          .eq("id", chatId as any);

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
        if (!currentChat || !currentChat.is_group_chat) {
          console.error("Current chat is not a group chat or not found");
          return;
        }

        const currentBots = currentChat.bots_ids || [];
        if (currentBots.includes(botId)) {
          console.log("Bot already in chat:", botId);
          return;
        }

        const updatedBots = [...currentBots, botId];
        console.log("Adding bot to group chat:", botId, "Updated bots:", updatedBots);
        
        const { error } = await supabase
          .from("protalk_chats")
          .update({ 
            bots_ids: updatedBots,
            updated_at: new Date().toISOString()
          } as any)
          .eq("id", currentChatId as any);

        if (error) {
          console.error("Error updating chat with new bot:", error);
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
        if (!currentChat || !currentChat.is_group_chat) {
          console.error("Current chat is not a group chat or not found");
          return;
        }

        const currentBots = currentChat.bots_ids || [];
        const updatedBots = currentBots.filter(id => id !== botId);
        console.log("Removing bot from group chat:", botId, "Updated bots:", updatedBots);
        
        const { error } = await supabase
          .from("protalk_chats")
          .update({ 
            bots_ids: updatedBots,
            updated_at: new Date().toISOString()
          } as any)
          .eq("id", currentChatId as any);

        if (error) {
          console.error("Error updating chat after removing bot:", error);
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
          title: "Бот удален",
          description: "Бот успешно удален из группового чата",
        });
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
