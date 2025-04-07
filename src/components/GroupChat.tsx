
import { useState, useEffect } from "react";
import { IChat, ChatBot, IFile } from "@/types/chat";
import { ChatHeader } from "./group-chat/ChatHeader";
import { ChatMessages } from "./group-chat/ChatMessages";
import { ChatInputArea } from "./group-chat/ChatInputArea";
import { NoSelectedChat } from "./group-chat/NoSelectedChat";

interface GroupChatProps {
  chat: IChat | undefined;
  onSendMessage: (message: string, files?: IFile[], specificBotId?: string | null) => void;
  isLoading: boolean;
  userBots: ChatBot[];
  onAddBotToGroupChat: (botId: string) => void;
  onRemoveBotFromGroupChat: (botId: string) => void;
  activeBotsInChat: string[];
}

export function GroupChat({
  chat,
  onSendMessage,
  isLoading,
  userBots,
  onAddBotToGroupChat,
  onRemoveBotFromGroupChat,
  activeBotsInChat
}: GroupChatProps) {
  const [isDiscussionActive, setIsDiscussionActive] = useState(false);
  
  const getBotNameById = (botId: string): string => {
    const bot = userBots.find(b => b.bot_id === botId);
    return bot?.name || "Бот";
  };
  
  const handleSendMessage = (message: string, files?: IFile[], targetBotId?: string | null) => {
    if (!chat || activeBotsInChat.length === 0) return;
    setIsDiscussionActive(true);
    onSendMessage(message, files, targetBotId);
  };

  useEffect(() => {
    if (!chat || !isDiscussionActive) return;
    
    const messages = chat.messages;
    if (messages.length === 0) return;
    
    let lastUserMsgIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }
    
    if (lastUserMsgIndex === -1) return;
    
    const botResponses = messages.slice(lastUserMsgIndex + 1).filter(msg => msg.role === "bot");
    const uniqueBotsResponded = new Set(botResponses.map(msg => msg.bot_id));
    
    if (uniqueBotsResponded.size >= activeBotsInChat.length) {
      setIsDiscussionActive(false);
    }
  }, [chat, isDiscussionActive, activeBotsInChat]);

  if (!chat) {
    return <NoSelectedChat />;
  }
  
  // Get the bot IDs as strings to pass to the ChatSettings component
  const userBotsIds = userBots.map(bot => bot.bot_id);
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatHeader 
        chat={chat}
        userBotsInChat={userBotsIds}
        onAddBotToGroupChat={onAddBotToGroupChat}
        onRemoveBotFromGroupChat={onRemoveBotFromGroupChat}
        activeBotsInChat={activeBotsInChat}
      />
      
      <ChatMessages 
        chat={chat}
        isLoading={isLoading}
      />
      
      <ChatInputArea 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isDiscussionActive={isDiscussionActive}
        activeBotsInChat={activeBotsInChat}
        getBotNameById={getBotNameById}
      />
    </div>
  );
}
