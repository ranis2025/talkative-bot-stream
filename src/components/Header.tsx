
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlusCircle, Menu, MessageSquare, Users, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from "@/components/ui/navigation-menu";

interface HeaderProps {
  onNewChat: () => void;
  onNewGroupChat?: () => void;
  isMobile?: boolean;
  onToggleSidebar?: () => void;
  chatView?: 'individual' | 'group';
}

export function Header({ 
  onNewChat, 
  onNewGroupChat,
  isMobile, 
  onToggleSidebar,
  chatView = 'individual'
}: HeaderProps) {
  const { logout } = useAuth();

  return (
    <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10">
      {isMobile && onToggleSidebar && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggleSidebar}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Меню</span>
        </Button>
      )}
      
      <div className="flex items-center">
        <div className="font-semibold text-lg mr-4">BIZO Чат</div>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={chatView === 'group' ? onNewGroupChat : onNewChat}
          className={!isMobile ? "mr-2" : ""}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {!isMobile && (
            <span>
              {chatView === 'group' ? 'Новый групповой чат' : 'Новый чат'}
            </span>
          )}
        </Button>
        
        {!isMobile && onNewGroupChat && chatView === 'individual' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onNewGroupChat}
            className="mr-2"
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Новый групповой чат</span>
          </Button>
        )}
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Settings className="h-4 w-4" />
                <span className="sr-only">Настройки</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="min-w-[200px]">
                <div className="p-2 flex flex-col gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="justify-start"
                  >
                    Выйти
                  </Button>
                  <ThemeToggle />
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
