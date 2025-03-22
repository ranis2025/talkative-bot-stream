
import { useState, useEffect, useCallback } from "react";
import { IChat, IMessage } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";

export const useChat = () => {
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChat, setCurrentChat] = useState<IChat | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { botId } = useParams();

  // Convert IMessage array to Json (compatible with Supabase)
  const messagesToJson = (messages: IMessage[]): any[] => {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp
    }));
  };

  // Convert Json array back to IMessage array
  const jsonToMessages = (json: any[]): IMessage[] => {
    return json.map(item => ({
      id: item.id,
      content: item.content,
      role: item.role,
      timestamp: item.timestamp
    }));
  };

  const fetchChats = useCallback(async () => {
    if (!user || !botId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("protalk_chats")
        .select("*")
        .eq("bot_id", botId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      const formattedChats: IChat[] = data.map((chat) => ({
        id: chat.id,
        title: chat.title,
        messages: jsonToMessages(chat.messages as any[]),
        botId: chat.bot_id,
      }));

      setChats(formattedChats);

      // Set current chat if selected
      if (selectedChat) {
        const selected = formattedChats.find((chat) => chat.id === selectedChat);
        if (selected) {
          setCurrentChat(selected);
        } else if (formattedChats.length > 0) {
          setCurrentChat(formattedChats[0]);
          setSelectedChat(formattedChats[0].id);
        } else {
          setCurrentChat(null);
          setSelectedChat(null);
        }
      } else if (formattedChats.length > 0) {
        setCurrentChat(formattedChats[0]);
        setSelectedChat(formattedChats[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить чаты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedChat, toast, botId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChat = async (message: string) => {
    if (!user || !botId) return null;

    try {
      const newMessage: IMessage = {
        id: uuidv4(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      const newChat: IChat = {
        id: uuidv4(),
        title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
        messages: [newMessage],
        botId: botId,
      };

      const { error } = await supabase.from("protalk_chats").insert({
        id: newChat.id,
        title: newChat.title,
        messages: messagesToJson(newChat.messages),
        bot_id: botId,
      });

      if (error) {
        throw error;
      }

      setChats((prev) => [newChat, ...prev]);
      setCurrentChat(newChat);
      setSelectedChat(newChat.id);

      return newChat;
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать чат",
        variant: "destructive",
      });
      return null;
    }
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setSelectedChat(chatId);
    }
  };

  const addMessage = async (chatId: string, message: string, role: "user" | "assistant") => {
    if (!user || !botId) return;

    try {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;

      const newMessage: IMessage = {
        id: uuidv4(),
        role,
        content: message,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...chat.messages, newMessage];
      const updatedChat = { ...chat, messages: updatedMessages };

      // Update local state first for immediate UI response
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? updatedChat : c))
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }

      // Then update in database
      const { error } = await supabase
        .from("protalk_chats")
        .update({
          messages: messagesToJson(updatedMessages),
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить сообщение",
        variant: "destructive",
      });
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("protalk_chats")
        .delete()
        .eq("id", chatId);

      if (error) {
        throw error;
      }

      setChats((prev) => prev.filter((c) => c.id !== chatId));

      if (selectedChat === chatId) {
        if (chats.length > 1) {
          const newSelectedChat = chats.find((c) => c.id !== chatId);
          if (newSelectedChat) {
            setCurrentChat(newSelectedChat);
            setSelectedChat(newSelectedChat.id);
          }
        } else {
          setCurrentChat(null);
          setSelectedChat(null);
        }
      }

      toast({
        title: "Успешно",
        description: "Чат удален",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить чат",
        variant: "destructive",
      });
    }
  };

  return {
    chats,
    currentChat,
    loading,
    createChat,
    selectChat,
    addMessage,
    deleteChat,
  };
};
