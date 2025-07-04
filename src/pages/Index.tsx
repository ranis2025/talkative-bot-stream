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
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const Index = () => {
  const {
    chats,
    currentChat,
    currentChatId,
    getChatLoading,
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
  const {
    token
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    console.log("Current chat:", currentChat);
    console.log("Chat view:", chatView);
    console.log("Current chat ID:", currentChatId);
  }, [currentChat, chatView, currentChatId]);
  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/chat?token=${token}`, {
        replace: true
      });
    }
  }, [token, searchParams, navigate]);

  // Set the chat view to individual on this page
  useEffect(() => {
    switchChatView("individual");
  }, [switchChatView]);
  useEffect(() => {
    setIsMobileView(!!isMobile);
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  const handleSelectChat = (chatId: string) => {
    console.log("Selecting chat with ID:", chatId);
    setCurrentChatId(chatId);
    if (isMobileView) {
      setSidebarOpen(false);
    }
  };
  const handleNewChat = () => {
    createChat();
    if (isMobileView) {
      setSidebarOpen(false);
    }
  };
  const handleNewGroupChat = () => {
    // Navigate to group chats page when creating a new group chat
    navigate("/group-chats");
  };
  const handleBackToList = () => {
    setSidebarOpen(true);
  };

  // Only show individual chats on this page
  const filteredChats = chats.filter(chat => !chat.is_group_chat);
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка чатов...</span>
      </div>;
  }
  return <div className="flex flex-col h-screen bg-background text-foreground">
      {isMobileView && !sidebarOpen && <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10">
          <button onClick={handleBackToList} className="flex items-center text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Назад к чатам</span>
          </button>
        </div>}

      {(!isMobileView || sidebarOpen) && <Header onNewChat={handleNewChat} onNewGroupChat={handleNewGroupChat} isMobile={isMobileView} onToggleSidebar={isMobileView ? toggleSidebar : undefined} chatView={chatView} />}

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("border-r bg-card h-full", isMobileView ? "absolute inset-0 z-20 transition-transform duration-300" : "w-80", !sidebarOpen && (isMobileView ? "translate-x-[-100%]" : "w-0"))}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-medium">Личные чаты</h2>
              {/*<Button variant="outline" size="sm" asChild className="hidden md:flex">
                <Link to="/group-chats" className="">
                  <Users className="h-4 w-4 mr-2" />
                  Групповые чаты
                </Link>
              </Button>*/}
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList chats={filteredChats} currentChatId={currentChatId} onSelectChat={handleSelectChat} onDeleteChat={deleteChat} onRenameChat={renameChat} userBots={userBots} currentBot={currentBot} onSelectBot={setCurrentBotId} chatView="individual" />
            </div>
            <div className="p-3 border-t flex gap-2">
              <Button onClick={handleNewChat} className="flex-1" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Новый чат
              </Button>
              
              {/*<Button onClick={handleNewGroupChat} variant="outline" size="sm" className="md:hidden">
                <Users className="h-4 w-4" />
                <span className="sr-only">Групповые чаты</span>
              </Button>*/}
            </div>
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col overflow-hidden", isMobileView && sidebarOpen && "hidden")}>
          {currentChat && <Chat chat={currentChat} onSendMessage={sendChatMessage} isLoading={getChatLoading(currentChat.id)} />}
          
          {!currentChat && <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-4">
                <h2 className="text-2xl font-medium">
                  Добро пожаловать в Чат
                </h2>
                <p className="text-muted-foreground">
                  Выберите или создайте чат, чтобы начать общение с ботом.
                </p>
                <div className="flex justify-center pt-4">
                  {/*<Button onClick={() => navigate("/group-chats")} className="flex items-center" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Перейти к групповым чатам
                  </Button>*/}
                </div>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export default Index;