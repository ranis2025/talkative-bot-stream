
import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { ChatList } from "@/components/ChatList";
import { GroupChat } from "@/components/GroupChat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users, UserPlus, Bot, Sparkles, RotateCw, Book, Lightbulb, MessageSquare, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const CONVERSATION_MODES = {
  debate: {
    name: "Дебаты",
    description: "Боты выражают противоположные точки зрения по заданной теме",
    icon: <MessageSquare className="h-4 w-4 mr-2" />,
    promptTemplate: (topic, botIndex, botsCount) => 
      `Topic: ${topic}. You are participating in a debate with other AI bots. You are Bot #${botIndex + 1} of ${botsCount}. ${
        botIndex === 0 ? "Present an argument supporting the topic." :
        botIndex === 1 ? "Present a counter-argument against the previous point." :
        "Analyze the previous arguments and provide your perspective, finding middle ground where possible."
      } Keep your response under 100 words and end with a question for the next bot.`
  },
  brainstorm: {
    name: "Мозговой штурм",
    description: "Боты генерируют и развивают идеи по заданной теме",
    icon: <Lightbulb className="h-4 w-4 mr-2" />,
    promptTemplate: (topic, botIndex, botsCount) => 
      `Topic: ${topic}. You are participating in a brainstorming session with other AI bots. You are Bot #${botIndex + 1} of ${botsCount}. ${
        botIndex === 0 ? "Start by explaining the topic and providing 2-3 initial ideas." :
        "Build upon or combine previous ideas. Introduce 1-2 new perspectives."
      } Keep your response under 100 words and frame it in a way that invites further development.`
  },
  storytelling: {
    name: "Совместное повествование",
    description: "Боты создают историю по цепочке, развивая сюжет",
    icon: <Book className="h-4 w-4 mr-2" />,
    promptTemplate: (topic, botIndex, botsCount) => 
      `Topic: ${topic}. You are participating in collaborative storytelling with other AI bots. You are Bot #${botIndex + 1} of ${botsCount}. ${
        botIndex === 0 ? "Start the story with an engaging introduction related to the topic." :
        "Continue the story from where the previous bot left off, introducing a new element or twist."
      } Write a short paragraph (3-4 sentences) and leave the story at a point that's easy for the next bot to continue.`
  }
};

const GROUP_CHAT_TEMPLATES = [
  {
    id: "debate",
    name: "Дебаты",
    description: "Обсуждение противоположных точек зрения",
    minBots: 2,
    suggestedTopics: ["Искусственный интеллект", "Глобальное потепление", "Освоение космоса"]
  },
  {
    id: "creative",
    name: "Творческая группа",
    description: "Совместное создание историй и идей",
    minBots: 2,
    suggestedTopics: ["Фантастический рассказ", "Бизнес-идея", "Сценарий фильма"]
  },
  {
    id: "expert",
    name: "Консультация экспертов",
    description: "Разбор вопроса с разных специализаций",
    minBots: 3,
    suggestedTopics: ["Технический проект", "Образовательная программа", "Здоровый образ жизни"]
  },
  {
    id: "free",
    name: "Свободный чат",
    description: "Произвольная беседа без шаблонов",
    minBots: 1,
    suggestedTopics: ["Любая тема", "Свободное общение", "Без ограничений"]
  }
];

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
  
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [autoConversationActive, setAutoConversationActive] = useState(false);
  const [autoConversationTopic, setAutoConversationTopic] = useState("");
  const [autoConversationInterval, setAutoConversationInterval] = useState<number | null>(null);
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false);
  const [selectedConversationMode, setSelectedConversationMode] = useState<string>("debate");
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [suggestedTopic, setSuggestedTopic] = useState<string>("");
  const [chatCount, setChatCount] = useState(0);
  const [groupPrompt, setGroupPrompt] = useState<string>("");
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  useEffect(() => {
    switchChatView("group");
    
    if (location.state?.createNew) {
      setIsNewChatDialogOpen(true);
    }
  }, [switchChatView, location.state]);

  useEffect(() => {
    if (isInitialized) {
      console.log("Initialized: Available chats:", chats);
    }
  }, [isInitialized, chats]);

  useEffect(() => {
    setIsMobileView(!!isMobile);
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const filteredChats = chats.filter(chat => chat.is_group_chat);
  
  const activeBotsInChat = currentChat?.bots_ids || [];

  useEffect(() => {
    console.log("GroupChats: Current chat:", currentChat);
    console.log("GroupChats: Active bots in chat:", activeBotsInChat);
    console.log("GroupChats: filteredChats:", filteredChats);
  }, [currentChat, activeBotsInChat, filteredChats]);

  useEffect(() => {
    setChatCount(filteredChats.length);
  }, [filteredChats]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleSelectChat = (chatId: string) => {
    console.log("Selecting group chat with ID:", chatId);
    setCurrentChatId(chatId);
    if (isMobileView) {
      setSidebarOpen(false);
    }
    
    if (autoConversationInterval) {
      clearInterval(autoConversationInterval);
      setAutoConversationInterval(null);
      setAutoConversationActive(false);
    }
  };

  const createNewGroupChat = useCallback(async () => {
    console.log("Creating new group chat");
    const newChatId = createGroupChat();
    console.log("New group chat created with ID:", newChatId);
    
    setTimeout(() => {
      if (selectedTemplate && suggestedTopic) {
        const foundTemplate = GROUP_CHAT_TEMPLATES.find(t => t.id === selectedTemplate);
        const templateName = foundTemplate?.name || 'Групповой чат';
        renameChat(newChatId, `${suggestedTopic} (${templateName})`);
      }
      
      // Give the state time to update
      setTimeout(() => {
        setCurrentChatId(newChatId);
        console.log("Setting current chat ID to:", newChatId);
      }, 200);
    }, 300);
    
    if (isMobileView) {
      setSidebarOpen(false);
    }
    
    setSelectedTemplate(null);
    setSuggestedTopic("");
    
    return newChatId;
  }, [createGroupChat, isMobileView, selectedTemplate, suggestedTopic, renameChat, setCurrentChatId]);

  const handleCreateFromTemplate = () => {
    createNewGroupChat();
    setIsNewChatDialogOpen(false);
  };

  const handleNewGroupChat = () => {
    setIsNewChatDialogOpen(true);
  };

  const handleBackToList = () => {
    setSidebarOpen(true);
  };

  const handleGoToRegularChats = () => {
    navigate("/chat");
  };

  const generateBotPrompt = (mode: string, topic: string, botIndex: number, botsCount: number) => {
    const selectedMode = CONVERSATION_MODES[mode as keyof typeof CONVERSATION_MODES] || CONVERSATION_MODES.debate;
    return selectedMode.promptTemplate(topic, botIndex, botsCount);
  };

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
      description: `Тема: ${autoConversationTopic}. Режим: ${CONVERSATION_MODES[selectedConversationMode as keyof typeof CONVERSATION_MODES]?.name || 'дебаты'}.`
    });
    
    let botIndex = 0;
    
    const initialPrompt = generateBotPrompt(
      selectedConversationMode, 
      autoConversationTopic, 
      botIndex, 
      activeBotsInChat.length
    );
    
    sendChatMessage(initialPrompt);
    botIndex = (botIndex + 1) % activeBotsInChat.length;
    
    const interval = window.setInterval(() => {
      if (!currentChat) {
        clearInterval(interval);
        setAutoConversationInterval(null);
        setAutoConversationActive(false);
        return;
      }
      
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
    }, 15000);
    
    setAutoConversationInterval(interval);
  };

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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = GROUP_CHAT_TEMPLATES.find(t => t.id === templateId);
    if (template && template.suggestedTopics.length > 0) {
      const randomTopic = template.suggestedTopics[Math.floor(Math.random() * template.suggestedTopics.length)];
      setSuggestedTopic(randomTopic);
    }
  };

  const sendGroupPrompt = () => {
    if (!currentChat || !groupPrompt.trim()) {
      toast({
        title: "Пустой промт",
        description: "Пожалуйста, введите промт для группы.",
        variant: "destructive"
      });
      return;
    }

    sendChatMessage(groupPrompt);
    setGroupPrompt("");
    setShowPromptDialog(false);
    
    toast({
      title: "Промт отправлен",
      description: "Промт успешно отправлен всем ботам в группе."
    });
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">Загрузка групповых чатов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {isMobileView && !sidebarOpen && (
        <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10 sticky top-0">
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
              {chatCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {chatCount}
                </Badge>
              )}
            </h1>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoToRegularChats}
            className="hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            К обычным чатам
          </Button>
          
          <Button 
            onClick={handleNewGroupChat}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Новый групповой чат
          </Button>
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
              {filteredChats.length > 0 ? (
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
              ) : (
                <div className="flex flex-col items-center justify-center h-48 p-4 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p>У вас пока нет групповых чатов</p>
                  <Button 
                    variant="link" 
                    className="mt-2" 
                    onClick={handleNewGroupChat}
                  >
                    Создать первый групповой чат
                  </Button>
                </div>
              )}
            </div>
            <div className="p-3 border-t">
              <Button 
                onClick={handleNewGroupChat}
                className="w-full"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Новый групповой чат
              </Button>
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
                  <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Промт для группы
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Отправить промт всей группе</DialogTitle>
                        <DialogDescription>
                          Напишите общий промт, который будет отправлен в групповой чат.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          value={groupPrompt}
                          onChange={(e) => setGroupPrompt(e.target.value)}
                          placeholder="Например: Представьте, что вы эксперты в области искусственного интеллекта..."
                          className="h-32"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPromptDialog(false)}>Отмена</Button>
                        <Button onClick={sendGroupPrompt}>Отправить</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                
                  <Dialog open={isNewTopicDialogOpen} onOpenChange={setIsNewTopicDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={autoConversationActive ? "destructive" : "outline"} 
                        size="sm"
                        onClick={autoConversationActive ? stopAutoConversation : () => setIsNewTopicDialogOpen(true)}
                        disabled={activeBotsInChat.length < 2}
                      >
                        {autoConversationActive ? (
                          <>
                            <RotateCw className="h-4 w-4 mr-2 animate-spin" />
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
                              {Object.entries(CONVERSATION_MODES).map(([key, mode]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center">
                                    {mode.icon}
                                    {mode.name}
                                  </div>
                                </SelectItem>
                              ))}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {GROUP_CHAT_TEMPLATES.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                      handleTemplateSelect(template.id);
                      setIsNewChatDialogOpen(true);
                    }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Создать
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                <Button 
                  onClick={handleNewGroupChat}
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать новый групповой чат
                </Button>
                
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
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Отправлять общий промт всей группе ботов одновременно</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Создание нового группового чата</DialogTitle>
            <DialogDescription>
              Выберите шаблон и настройте параметры для нового группового чата.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Шаблон чата</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {GROUP_CHAT_TEMPLATES.map(template => (
                  <div 
                    key={template.id}
                    className={cn(
                      "border rounded-md p-3 cursor-pointer hover:border-primary transition-colors",
                      selectedTemplate === template.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic">Тема чата</Label>
              <Input
                id="topic"
                value={suggestedTopic}
                onChange={(e) => setSuggestedTopic(e.target.value)}
                placeholder="Введите тему для обсуждения"
              />
              {selectedTemplate && (
                <div className="text-xs text-muted-foreground">
                  Рекомендуется минимум {GROUP_CHAT_TEMPLATES.find(t => t.id === selectedTemplate)?.minBots || 2} бота для этого шаблона
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateFromTemplate}>Создать групповой чат</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChats;
