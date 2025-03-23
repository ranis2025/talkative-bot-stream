
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlusCircle, Menu, MessageSquare, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
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
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
  const isAdminPage = location.pathname.includes("/admin");

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate(token ? `/admin-auth?token=${token}` : '/admin-auth');
    }
  };
  
  const handleAdminLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin-auth");
  };

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
        {!isAdminPage && (
          <>
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
          </>
        )}

        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleAdminClick}
          title="Панель администратора"
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Настройки</span>
        </Button>

        <ThemeToggle />
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={isAdminPage ? handleAdminLogout : logout}
          title={isAdminPage ? "Выйти из панели администратора" : "Выйти из системы"}
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Выйти</span>
        </Button>
      </div>
    </div>
  );
}
