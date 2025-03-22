
import { useState, useEffect, useCallback } from "react";
import { IChat, IMessage } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "@/lib/chatApi";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useChat() {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  // Загрузка чатов из Supabase при инициализации
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('protalk_chats')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (error) {
          throw error;
        }

        // Преобразование данных из Supabase в формат IChat
        const formattedChats: IChat[] = data.map((chat) => ({
          id: chat.id,
          title: chat.title,
          messages: Array.isArray(chat.messages) 
            ? chat.messages.map((msg: any) => ({
                id: msg.id || uuidv4(),
                content: msg.content || "",
                role: msg.role || "user",
                timestamp: msg.timestamp || Date.now()
              }))
            : [],
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime()
        }));
        
        setChats(formattedChats);
        
        // Если есть чаты, устанавливаем последний активный
        if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить чаты из базы данных.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    fetchChats();
  }, [toast]);

  // Получение текущего чата
  const currentChat = chats.find(chat => chat.id === currentChatId);
  
  // Создание нового чата
  const createChat = useCallback(async () => {
    try {
      const newChatId = uuidv4();
      const newChat: IChat = {
        id: newChatId,
        title: `Новый чат ${chats.length + 1}`,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Сохраняем в Supabase
      const { error } = await supabase
        .from('protalk_chats')
        .insert({
          id: newChatId,
          title: newChat.title,
          messages: [],
          created_at: new Date(newChat.createdAt).toISOString(),
          updated_at: new Date(newChat.updatedAt).toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      
      return newChatId;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый чат.",
        variant: "destructive"
      });
      return null;
    }
  }, [chats, toast]);

  // Отправка сообщения
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      // Если нет активного чата, создаем новый
      let chatId = currentChatId;
      if (!chatId) {
        chatId = await createChat();
        if (!chatId) return; // Если не удалось создать чат
      }
      
      // Создаем сообщение пользователя
      const userMessage: IMessage = {
        id: uuidv4(),
        content: message,
        role: 'user',
        timestamp: Date.now()
      };
      
      // Находим текущий чат
      const currentChatIndex = chats.findIndex(chat => chat.id === chatId);
      if (currentChatIndex === -1) return;
      
      const updatedChat = { ...chats[currentChatIndex] };
      
      // Обновляем заголовок чата на основе первого сообщения
      const shouldUpdateTitle = updatedChat.messages.length === 0;
      if (shouldUpdateTitle) {
        updatedChat.title = message.length > 30 
          ? `${message.substring(0, 30)}...` 
          : message;
      }
      
      // Добавляем сообщение пользователя
      updatedChat.messages = [...updatedChat.messages, userMessage];
      updatedChat.updatedAt = Date.now();
      
      // Обновляем состояние чата с сообщением пользователя
      const updatedChats = [...chats];
      updatedChats[currentChatIndex] = updatedChat;
      setChats(updatedChats);
      
      // Отправляем запрос к API
      setLoading(true);
      const response = await sendMessage(chatId, message);
      
      // Создаем сообщение от бота
      const botMessage: IMessage = {
        id: uuidv4(),
        content: response,
        role: 'bot',
        timestamp: Date.now()
      };
      
      // Добавляем сообщение бота
      const finalChat = { 
        ...updatedChat,
        messages: [...updatedChat.messages, botMessage],
        updatedAt: Date.now()
      };
      
      // Обновляем состояние с ответом бота
      const finalChats = [...updatedChats];
      finalChats[currentChatIndex] = finalChat;
      setChats(finalChats);
      
      // Преобразуем сообщения в формат, соответствующий Json для Supabase
      const messagesForSupabase = finalChat.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      }));
      
      // Сохраняем обновленный чат в Supabase
      const { error } = await supabase
        .from('protalk_chats')
        .update({
          title: finalChat.title,
          messages: messagesForSupabase,
          updated_at: new Date(finalChat.updatedAt).toISOString()
        })
        .eq('id', chatId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.",
        variant: "destructive"
      });
      console.error("Error in sendChatMessage:", error);
    } finally {
      setLoading(false);
    }
  }, [currentChatId, chats, createChat, toast]);

  // Удаление чата
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      // Удаляем из Supabase
      const { error } = await supabase
        .from('protalk_chats')
        .delete()
        .eq('id', chatId);
        
      if (error) {
        throw error;
      }
      
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      
      // Если удаляем текущий чат, выбираем следующий доступный
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат.",
        variant: "destructive"
      });
    }
  }, [currentChatId, chats, toast]);

  // Переименование чата
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      // Обновляем локальное состояние
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            return { ...chat, title: newTitle };
          }
          return chat;
        });
      });
      
      // Обновляем в Supabase
      const { error } = await supabase
        .from('protalk_chats')
        .update({ title: newTitle })
        .eq('id', chatId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось переименовать чат.",
        variant: "destructive"
      });
    }
  }, [toast]);

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
  };
}
