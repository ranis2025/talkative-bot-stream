import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlusCircle, Menu, MessageSquare, Users, Settings, LogOut, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
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
  const {
    logout,
    token
  } = useAuth();
  const navigate = useNavigate();

  // Extract application name from token if it follows the format "AppName:User"
  const getAppName = () => {
    if (!token) return "ProTalk";

    // Check if token follows the expected format
    const tokenParts = token.split(':');
    if (tokenParts.length === 2) {
      return tokenParts[0]; // Return the app name part
    }
    return "ProTalk"; // Default fallback
  };
  const appName = getAppName();
  const handleAdminClick = () => {
    navigate(token ? `/admin?token=${token}` : '/admin');
  };
  const handleTokenAdminClick = () => {
    navigate(token ? `/token-admin?token=${token}` : '/token-admin');
  };
  return <div className="w-full flex items-center p-4 border-b bg-background/80 backdrop-blur-md z-10">
      {isMobile && onToggleSidebar && <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Меню</span>
        </Button>}
      
      <div className="flex items-center">
        <div className="font-semibold text-lg mr-4">{appName} Чат</div>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={chatView === 'group' ? onNewGroupChat : onNewChat} className={!isMobile ? "mr-2" : ""}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {!isMobile && <span>
              {chatView === 'group' ? 'Новый групповой чат' : 'Новый чат'}
            </span>}
        </Button>
        
        {!isMobile && onNewGroupChat && chatView === 'individual' && <Button variant="outline" size="sm" onClick={onNewGroupChat} className="mr-2">
            <Users className="h-4 w-4 mr-2" />
            <span>Новый групповой чат</span>
          </Button>}

        <Button variant="ghost" size="icon" onClick={handleAdminClick} title="Панель администратора" className="">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Настройки</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={handleTokenAdminClick} title="Управление токенами" className="">
          <Key className="h-5 w-5" />
          <span className="sr-only">Токены</span>
        </Button>

        <ThemeToggle />
        
        <Button variant="ghost" size="icon" onClick={logout} title="Выйти из системы">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Выйти</span>
        </Button>
      </div>
    </div>;
}