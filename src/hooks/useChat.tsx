
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { IChat, IMessage } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage } from "@/lib/chatApi";

// Helper function to get bot_id from URL
const getBotIdFromUrl = (): string | null => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get('bot_id');
};

export const useChat = () => {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const currentBotId = getBotIdFromUrl();

  // Fetch chats from Supabase
  const fetchChats = useCallback(async () => {
    try {
      let query = supabase.from("protalk_chats");
      
      // Filter by bot_id if it exists in the URL
      if (currentBotId) {
        query = query.eq('bot_id', currentBotId);
      }
      
      const { data, error } = await query.order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedChats = data.map((chat) => ({
          id: chat.id,
          title: chat.title,
          messages: Array.isArray(chat.messages) ? chat.messages : [],
          bot_id: chat.bot_id || null,
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime(),
        }));
        
        setChats(formattedChats);
        
        // Set the first chat as current if there is no current chat
        if (formattedChats.length > 0 && !currentChatId) {
          setCurrentChatId(formattedChats[0].id);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чаты",
        variant: "destructive",
      });
      setIsInitialized(true);
    }
  }, [currentBotId, currentChatId, toast]);

  // Re-fetch chats when the URL changes
  useEffect(() => {
    fetchChats();
  }, [fetchChats, location.search]);
  
  // Create a new chat
  const createChat = useCallback(async () => {
    try {
      const newChatId = uuidv4();
      const newChat: IChat = {
        id: newChatId,
        title: "Новый чат",
        messages: [],
        bot_id: currentBotId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const { error } = await supabase.from("protalk_chats").insert({
        id: newChat.id,
        title: newChat.title,
        messages: newChat.messages,
        bot_id: newChat.bot_id,
        created_at: new Date(newChat.createdAt).toISOString(),
        updated_at: new Date(newChat.updatedAt).toISOString(),
      });
      
      if (error) throw error;
      
      setChats((prevChats) => [newChat, ...prevChats]);
      setCurrentChatId(newChatId);
      
      return newChatId;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый чат",
        variant: "destructive",
      });
      return null;
    }
  }, [currentBotId, toast]);
  
  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const { error } = await supabase.from("protalk_chats").delete().eq("id", chatId);
      
      if (error) throw error;
      
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      
      // If the deleted chat was the current one, select another chat
      if (currentChatId === chatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          setCurrentChatId(null);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive",
      });
    }
  }, [chats, currentChatId, toast]);

  // Rename a chat
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("protalk_chats")
        .update({ title: newTitle })
        .eq("id", chatId);
      
      if (error) throw error;
      
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
  }, [toast]);

  // Send a message in the current chat
  const sendChatMessage = useCallback(async (content: string) => {
    if (!currentChatId || !content.trim()) return;
    
    setLoading(true);
    
    try {
      // Find the current chat
      const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
      if (chatIndex === -1) throw new Error("Chat not found");
      
      const chat = chats[chatIndex];
      
      // Create user message
      const userMessage: IMessage = {
        id: uuidv4(),
        content,
        role: "user",
        timestamp: Date.now(),
      };
      
      // Update chat with user message
      const updatedMessages = [...chat.messages, userMessage];
      const updatedChat = { ...chat, messages: updatedMessages, updatedAt: Date.now() };
      
      // Update chat in state
      setChats((prevChats) =>
        prevChats.map((c) => (c.id === currentChatId ? updatedChat : c))
      );
      
      // Update chat in Supabase
      await supabase
        .from("protalk_chats")
        .update({
          messages: updatedMessages,
          updated_at: new Date(updatedChat.updatedAt).toISOString(),
        })
        .eq("id", currentChatId);
      
      // Send message to AI and get response
      const response = await sendMessage({
        chat_id: currentChatId,
        message: content,
        bot_id: currentBotId || "",
      });
      
      if (!response.ok) throw new Error("Failed to get AI response");
      
      // Create bot message
      const botMessage: IMessage = {
        id: uuidv4(),
        content: response.done,
        role: "bot",
        timestamp: Date.now(),
      };
      
      // Update chat with bot message
      const finalMessages = [...updatedMessages, botMessage];
      const finalChat = { ...updatedChat, messages: finalMessages, updatedAt: Date.now() };
      
      // Update chat in state
      setChats((prevChats) =>
        prevChats.map((c) => (c.id === currentChatId ? finalChat : c))
      );
      
      // Update chat in Supabase
      await supabase
        .from("protalk_chats")
        .update({
          messages: finalMessages,
          updated_at: new Date(finalChat.updatedAt).toISOString(),
        })
        .eq("id", currentChatId);
      
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
  }, [chats, currentChatId, currentBotId, toast]);

  // Get the current chat
  const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

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
};
