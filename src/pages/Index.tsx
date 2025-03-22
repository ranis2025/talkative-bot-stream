
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { ChatList } from "@/components/ChatList";
import { Chat } from "@/components/Chat";
import { GroupChat } from "@/components/GroupChat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const {
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
    userBots,
    currentBot,
    setCurrentBotId,
    chatView,
    switchChatView,
    addBotToGroupChat,
    removeBotFromGroupChat
  } = useChat();

  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  // Ensure token is preserved in URL
  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/chat?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  // Обработка изменения размера экрана
  useEffect(() => {
    setIsMobileView(!!isMobile);
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Переключение сайдбара
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // При выборе чата на мобильных устройствах скрываем сайдбар
  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (isMobileView) {
      setSidebarOpen(false);
    }
  };

  // Объединяем создание нового чата с переключением на него
  const handleNewChat = () => {
    createChat();
    if (isMobileView) {
      setSidebarOpen(false);
    }
  };

  // Создание нового группового чата
  const handleNewGroupChat = () => {
    createGroupChat();
    if (isMobileView) {
      setSidebarOpen(false);
    }
  };

  // Возврат к списку чатов на мобильных устройствах
  const handleBackToList = () => {
    setSidebarOpen(true);
  };

  // Фильтрация чатов по текущему представлению
  const filteredChats = chats.filter(chat => 
    chatView === 'group' ? chat.is_group_chat : !chat.is_group_chat
  );

  // Получение активных ботов для текущего группового чата
  const activeBotsInChat = currentChat?.bots_ids || [];

  // Отображаем загрузку, пока данные инициализируются
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка чатов...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Мобильная версия заголовка */}
      {isMobileView && !sidebarOpen && (
        <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Назад к чатам</span>
          </button>
        </div>
      )}

      {/* Десктопная версия заголовка или заголовок сайдбара на мобильных */}
      {(!isMobileView || sidebarOpen) && (
        <Header 
          onNewChat={handleNewChat} 
          onNewGroupChat={handleNewGroupChat}
          isMobile={isMobileView} 
          onToggleSidebar={isMobileView ? toggleSidebar : undefined}
          chatView={chatView}
        />
      )}

      {/* Основной контейнер */}
      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар с чатами */}
        <div className={cn(
          "border-r bg-card h-full",
          isMobileView ? "absolute inset-0 z-20 transition-transform duration-300" : "w-80",
          !sidebarOpen && (isMobileView ? "translate-x-[-100%]" : "w-0")
        )}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <Tabs 
                defaultValue={chatView} 
                onValueChange={(value) => switchChatView(value as 'individual' | 'group')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="individual" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Личные чаты
                  </TabsTrigger>
                  <TabsTrigger value="group" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Групповые чаты
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList 
                chats={filteredChats}
                currentChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
                userBots={userBots}
                currentBot={currentBot}
                onSelectBot={setCurrentBotId}
                chatView={chatView}
              />
            </div>
            <div className="p-3 border-t">
              <Button 
                onClick={chatView === 'group' ? handleNewGroupChat : handleNewChat}
                className="w-full"
                size="sm"
              >
                {chatView === 'group' ? 'Новый групповой чат' : 'Новый чат'}
              </Button>
            </div>
          </div>
        </div>

        {/* Основная область с чатом */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isMobileView && sidebarOpen && "hidden"
        )}>
          {currentChat?.is_group_chat ? (
            <GroupChat 
              chat={currentChat} 
              onSendMessage={sendChatMessage}
              isLoading={loading}
              userBots={userBots}
              onAddBotToChat={addBotToGroupChat}
              onRemoveBotFromChat={removeBotFromGroupChat}
              activeBotsInChat={activeBotsInChat}
            />
          ) : (
            <Chat 
              chat={currentChat} 
              onSendMessage={sendChatMessage}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
