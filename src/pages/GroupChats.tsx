
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { ChatList } from "@/components/ChatList";
import { GroupChat } from "@/components/GroupChat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users, UserPlus, Bot, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const GroupChats = () => {
  const {
    chats,
    currentChat,
    currentChatId,
    loading,
    isInitialized,
    setCurrentChatId,
    createGroupChat,
    sendChatMessage,
    deleteChat,
    renameChat,
    userBots,
    addBotToGroupChat,
    removeBotFromGroupChat,
    switchChatView
  } = useChat();
  
  const { token } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [autoConversationActive, setAutoConversationActive] = useState(false);
  const [autoConversationTopic, setAutoConversationTopic] = useState("");
  const [autoConversationInterval, setAutoConversationInterval] = useState<number | null>(null);
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false);
  const [selectedConversationMode, setSelectedConversationMode] = useState<string>("debate");
  const [hasCreatedChat, setHasCreatedChat] = useState(false);
  const [isSwitchingToNewChat, setIsSwitchingToNewChat] = useState(false);
  const [isNewGroupChatDialogOpen, setIsNewGroupChatDialogOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("Новый групповой чат");

  // Switch to group chat view when component mounts
  useEffect(() => {
    if (token) {
      console.log("Switching to group chat view");
      switchChatView("group");
    }
  }, [switchChatView, token]);

  useEffect(() => {
    setIsMobileView(!!isMobile);
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Filter chats to only show group chats
  const filteredChats = chats.filter(chat => chat.is_group_chat);
  
  // Get active bots in current chat
  const activeBotsInChat = currentChat?.bots_ids || [];

  // Effect to log current state for debugging
  useEffect(() => {
    console.log("GroupChats: Current chat:", currentChat);
    console.log("GroupChats: Active bots in chat:", activeBotsInChat);
    console.log("GroupChats: Using auth token:", token);
    console.log("GroupChats: Has created chat:", hasCreatedChat);
    console.log("GroupChats: Is switching to new chat:", isSwitchingToNewChat);
    console.log("GroupChats: User bots count:", userBots.length);
    console.log("GroupChats: Filtered group chats:", filteredChats);
    console.log("GroupChats: Is mobile view:", isMobileView);
  }, [currentChat, activeBotsInChat, token, hasCreatedChat, isSwitchingToNewChat, userBots, filteredChats, isMobileView]);

  // Clear creation flags when currentChat changes
  useEffect(() => {
    if ((hasCreatedChat || isSwitchingToNewChat) && currentChat) {
      setHasCreatedChat(false);
      setIsSwitchingToNewChat(false);
    }
  }, [currentChat, hasCreatedChat, isSwitchingToNewChat]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    console.log("Selecting group chat with ID:", chatId);
    setCurrentChatId(chatId);
    if (isMobileView) {
      setSidebarOpen(false);
    }
    
    // Stop auto-conversation if active
    if (autoConversationInterval) {
      clearInterval(autoConversationInterval);
      setAutoConversationInterval(null);
      setAutoConversationActive(false);
    }
  };

  // Handle new group chat creation
  const handleNewGroupChat = async () => {
    try {
      // Set flags to indicate we're creating a chat and switching to it
      setHasCreatedChat(true);
      setIsSwitchingToNewChat(true);
      setIsNewGroupChatDialogOpen(false);
      
      console.log("Creating new group chat with title:", newChatTitle);
      
      // Create the chat and wait for it to complete
      const newChatId = await createGroupChat();
      console.log("New group chat created with ID:", newChatId);
      
      if (newChatId) {
        // If we have a custom title, rename the chat
        if (newChatTitle && newChatTitle !== "Новый групповой чат") {
          await renameChat(newChatId, newChatTitle);
        }
        
        // Set current chat ID to the new chat
        setCurrentChatId(newChatId);
        
        // Ensure we're not in mobile view after creating a chat
        if (isMobileView) {
          setSidebarOpen(false);
        }
        
        toast({
          title: "Успех",
          description: "Групповой чат успешно создан",
        });
      } else {
        // Reset the flags if chat creation failed
        setHasCreatedChat(false);
        setIsSwitchingToNewChat(false);
        toast({
          title: "Ошибка",
          description: "Не удалось создать групповой чат",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
      setHasCreatedChat(false);
      setIsSwitchingToNewChat(false);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании группового чата",
        variant: "destructive",
      });
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setSidebarOpen(true);
  };

  // Navigate to regular chats
  const handleGoToRegularChats = () => {
    navigate("/chat");
  };

  // Generate bot conversation prompt based on mode and topic
  const generateBotPrompt = (mode: string, topic: string, botIndex: number, botsCount: number) => {
    const commonPrompt = `Topic: ${topic}. You are participating in a ${mode} with other AI bots.`;
    
    switch (mode) {
      case "debate":
        return `${commonPrompt} You are Bot #${botIndex + 1} of ${botsCount}. ${
          botIndex === 0 ? "Present an argument supporting the topic." :
          botIndex === 1 ? "Present a counter-argument against the previous point." :
          "Analyze the previous arguments and provide your perspective, finding middle ground where possible."
        } Keep your response under 100 words and end with a question for the next bot.`;
      
      case "brainstorm":
        return `${commonPrompt} You are Bot #${botIndex + 1} of ${botsCount}. ${
          botIndex === 0 ? "Start by explaining the topic and providing 2-3 initial ideas." :
          "Build upon or combine previous ideas. Introduce 1-2 new perspectives."
        } Keep your response under 100 words and frame it in a way that invites further development.`;
      
      case "storytelling":
        return `${commonPrompt} You are Bot #${botIndex + 1} of ${botsCount} collaboratively creating a story. ${
          botIndex === 0 ? "Start the story with an engaging introduction related to the topic." :
          "Continue the story from where the previous bot left off, introducing a new element or twist."
        } Write a short paragraph (3-4 sentences) and leave the story at a point that's easy for the next bot to continue.`;
        
      default:
        return `${commonPrompt} Respond to the previous message and ask a question related to the topic. Keep your response under 100 words.`;
    }
  };

  // Start auto conversation between bots
  const startAutoConversation = () => {
    if (!currentChat || activeBotsInChat.length < 2) {
      toast({
        title: "Недостаточно ботов",
        description: "Для автоматической беседы нужно как минимум 2 бота в чате.",
        variant: "destructive"
      });
      return;
    }
    
    if (!autoConversationTopic) {
      setIsNewTopicDialogOpen(true);
      return;
    }
    
    setAutoConversationActive(true);
    toast({
      title: "Автоматическая беседа запущена",
      description: `Тема: ${autoConversationTopic}. Режим: ${selectedConversationMode}.`
    });
    
    let botIndex = 0;
    
    // Send the initial prompt to start the conversation
    const initialPrompt = generateBotPrompt(
      selectedConversationMode, 
      autoConversationTopic, 
      botIndex, 
      activeBotsInChat.length
    );
    
    sendChatMessage(initialPrompt);
    botIndex = (botIndex + 1) % activeBotsInChat.length;
    
    // Set up interval to continue the conversation
    const interval = window.setInterval(() => {
      if (!currentChat) {
        clearInterval(interval);
        setAutoConversationInterval(null);
        setAutoConversationActive(false);
        return;
      }
      
      // Get the last message to use as context
      const lastMessages = currentChat.messages.slice(-3);
      const lastMessagesContent = lastMessages.map(msg => msg.content).join("\n");
      
      const prompt = generateBotPrompt(
        selectedConversationMode, 
        autoConversationTopic, 
        botIndex, 
        activeBotsInChat.length
      ) + `\n\nPrevious messages:\n${lastMessagesContent}`;
      
      sendChatMessage(prompt);
      botIndex = (botIndex + 1) % activeBotsInChat.length;
    }, 15000); // 15 seconds interval between messages
    
    setAutoConversationInterval(interval);
  };

  // Stop auto conversation
  const stopAutoConversation = () => {
    if (autoConversationInterval) {
      clearInterval(autoConversationInterval);
      setAutoConversationInterval(null);
      setAutoConversationActive(false);
      toast({
        title: "Автоматическая беседа остановлена",
        description: "Боты прекратили автоматическое общение."
      });
    }
  };

  // Set new conversation topic and start conversation
  const setNewTopicAndStart = () => {
    if (!autoConversationTopic) {
      toast({
        title: "Нужна тема",
        description: "Пожалуйста, введите тему для обсуждения.",
        variant: "destructive"
      });
      return;
    }
    
    setIsNewTopicDialogOpen(false);
    startAutoConversation();
  };
  
  // Reset new chat form
  const resetNewChatForm = () => {
    setNewChatTitle("Новый групповой чат");
  };
  
  // Open new chat dialog
  const openNewChatDialog = () => {
    resetNewChatForm();
    setIsNewGroupChatDialogOpen(true);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Проверка токена...</span>
      </div>
    );
  }

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
      {/* New Group Chat Dialog */}
      <Dialog open={isNewGroupChatDialogOpen} onOpenChange={setIsNewGroupChatDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать новый групповой чат</DialogTitle>
            <DialogDescription>
              Укажите название для нового группового чата. После создания вы сможете добавить ботов.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chat-title" className="text-right">
                Название
              </Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Введите название чата"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewGroupChatDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleNewGroupChat}
              disabled={hasCreatedChat || isSwitchingToNewChat}
            >
              {(hasCreatedChat || isSwitchingToNewChat) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать чат"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMobileView && !sidebarOpen && (
        <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Назад к списку</span>
          </button>
        </div>
      )}

      <div className="border-b p-4 flex justify-between items-center bg-card">
        <div className="flex items-center">
          {(!isMobileView || sidebarOpen) && (
            <h1 className="text-xl font-semibold flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Групповые чаты
            </h1>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoToRegularChats}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            К обычным чатам
          </Button>
          
          {/* Hiding this button as requested */}
          {!isMobileView && (
            <Button 
              onClick={openNewChatDialog}
              size="sm"
              disabled={hasCreatedChat || isSwitchingToNewChat}
              className="hidden"
            >
              {(hasCreatedChat || isSwitchingToNewChat) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Новый групповой чат
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn(
          "border-r bg-card h-full",
          isMobileView ? "absolute inset-0 z-20 transition-transform duration-300" : "w-80",
          !sidebarOpen && (isMobileView ? "translate-x-[-100%]" : "w-0")
        )}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-medium">Список групповых чатов</h2>
              {isMobileView && (
                <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList 
                chats={filteredChats}
                currentChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
                userBots={userBots}
                currentBot={null}
                onSelectBot={() => {}}
                chatView="group"
              />
            </div>
            <div className="p-3 border-t">
              <Button 
                onClick={openNewChatDialog}
                className="w-full"
                size="sm"
                disabled={hasCreatedChat || isSwitchingToNewChat}
              >
                {(hasCreatedChat || isSwitchingToNewChat) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Новый групповой чат
              </Button>
              
              {/* Add mobile view button to regular chats */}
              {isMobileView && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGoToRegularChats}
                  className="w-full mt-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  К обычным чатам
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isMobileView && sidebarOpen && "hidden"
        )}>
          {currentChat ? (
            <>
              <div className="bg-card/50 border-b p-3 flex justify-between items-center">
                <h2 className="font-medium truncate max-w-xs">
                  {currentChat.title}
                </h2>
                
                <div className="flex items-center space-x-3">
                  {/* Hiding this button as requested */}
                  <Dialog open={isNewTopicDialogOpen} onOpenChange={setIsNewTopicDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={autoConversationActive ? "destructive" : "outline"} 
                        size="sm"
                        onClick={autoConversationActive ? stopAutoConversation : () => setIsNewTopicDialogOpen(true)}
                        disabled={activeBotsInChat.length < 2}
                        className="hidden"
                      >
                        {autoConversationActive ? (
                          <>
                            <Bot className="h-4 w-4 mr-2" />
                            Остановить беседу
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Запустить беседу ботов
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Запустить беседу между ботами</DialogTitle>
                        <DialogDescription>
                          Выберите тему и режим для автоматической беседы между ботами в этом чате.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="topic" className="text-right">
                            Тема
                          </Label>
                          <Input
                            id="topic"
                            value={autoConversationTopic}
                            onChange={(e) => setAutoConversationTopic(e.target.value)}
                            placeholder="Например: Искусственный интеллект"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="mode" className="text-right">
                            Режим
                          </Label>
                          <Select
                            value={selectedConversationMode}
                            onValueChange={setSelectedConversationMode}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Выберите режим" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debate">Дебаты</SelectItem>
                              <SelectItem value="brainstorm">Мозговой штурм</SelectItem>
                              <SelectItem value="storytelling">Совместное повествование</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={setNewTopicAndStart}>Начать беседу</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {!isMobileView && (
                    <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <GroupChat 
                chat={currentChat} 
                onSendMessage={sendChatMessage}
                isLoading={loading}
                userBots={userBots}
                onAddBotToChat={addBotToGroupChat}
                onRemoveBotFromChat={removeBotFromGroupChat}
                activeBotsInChat={activeBotsInChat}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-4">
                <h2 className="text-2xl font-medium">Добро пожаловать в Групповые Чаты</h2>
                <p className="text-muted-foreground">
                  Создайте новый групповой чат или выберите существующий, чтобы начать общение с несколькими ботами одновременно.
                </p>
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Что можно делать в групповых чатах:
                  </h3>
                  <ul className="text-sm text-muted-foreground text-left space-y-2">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Запустить автоматическую беседу между ботами на выбранную тему</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Наблюдать за дебатами между ботами с разными мнениями</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Проводить мозговой штурм с несколькими ИИ-ассистентами</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Создавать совместные истории, где каждый бот добавляет свой фрагмент</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={openNewChatDialog}
                  className="mx-auto"
                  size="lg"
                  disabled={hasCreatedChat || isSwitchingToNewChat}
                >
                  {(hasCreatedChat || isSwitchingToNewChat) ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  Создать групповой чат
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChats;
