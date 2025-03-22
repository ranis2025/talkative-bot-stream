
import { useState, useEffect, useCallback } from "react";
import { IChat, IMessage } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "@/lib/chatApi";
import { useToast } from "@/components/ui/use-toast";

// Ключ для хранения чатов в localStorage
const STORAGE_KEY = 'ai_chat_threads';

export function useChat() {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Загрузка чатов из localStorage при инициализации
  useEffect(() => {
    const storedChats = localStorage.getItem(STORAGE_KEY);
    if (storedChats) {
      const parsedChats = JSON.parse(storedChats);
      setChats(parsedChats);
      
      // Если есть чаты, устанавливаем последний активный
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
      }
    }
  }, []);

  // Сохранение чатов в localStorage при их изменении
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  }, [chats]);

  // Получение текущего чата
  const currentChat = chats.find(chat => chat.id === currentChatId);
  
  // Создание нового чата
  const createChat = useCallback(() => {
    const newChatId = uuidv4();
    const newChat: IChat = {
      id: newChatId,
      title: `Новый чат ${chats.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    
    return newChatId;
  }, [chats]);

  // Отправка сообщения
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      // Если нет активного чата, создаем новый
      let chatId = currentChatId;
      if (!chatId) {
        chatId = createChat();
      }
      
      // Создаем сообщение пользователя
      const userMessage: IMessage = {
        id: uuidv4(),
        content: message,
        role: 'user',
        timestamp: Date.now()
      };
      
      // Обновляем состояние чата с сообщением пользователя
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            // Обновляем заголовок чата на основе первого сообщения
            const shouldUpdateTitle = chat.messages.length === 0;
            const title = shouldUpdateTitle 
              ? message.length > 30 
                ? `${message.substring(0, 30)}...` 
                : message
              : chat.title;
              
            return {
              ...chat,
              title,
              messages: [...chat.messages, userMessage],
              updatedAt: Date.now()
            };
          }
          return chat;
        });
      });
      
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
      
      // Обновляем состояние чата с ответом бота
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, botMessage],
              updatedAt: Date.now()
            };
          }
          return chat;
        });
      });
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
  }, [currentChatId, createChat, toast]);

  // Удаление чата
  const deleteChat = useCallback((chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // Если удаляем текущий чат, выбираем следующий доступный
    if (currentChatId === chatId) {
      setCurrentChatId(prevChats => {
        const filteredChats = prevChats.filter(chat => chat.id !== chatId);
        return filteredChats.length > 0 ? filteredChats[0].id : null;
      });
    }
  }, [currentChatId]);

  // Переименование чата
  const renameChat = useCallback((chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, title: newTitle };
        }
        return chat;
      });
    });
  }, []);

  return {
    chats,
    currentChat,
    currentChatId,
    loading,
    setCurrentChatId,
    createChat,
    sendChatMessage,
    deleteChat,
    renameChat,
  };
}
