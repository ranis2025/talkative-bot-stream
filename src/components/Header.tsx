
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, LogOut } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onNewChat: () => void;
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onNewChat, isMobile, onToggleSidebar }: HeaderProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Function to sign out - just redirects to auth page
  const signOut = () => {
    navigate("/auth");
  };

  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!token) return "U";
    return token.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md z-10">
      <div className="flex items-center">
        {isMobile && onToggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar}
            className="mr-2"
          >
            <span className="sr-only">Меню</span>
            <div className="w-5 space-y-1.5">
              <span className="block w-5 h-0.5 bg-foreground"></span>
              <span className="block w-3 h-0.5 bg-foreground"></span>
              <span className="block w-5 h-0.5 bg-foreground"></span>
            </div>
          </Button>
        )}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/bf49cbb2-32bd-471b-9256-7db1562592e2.png" 
            alt="Bizo Logo" 
            className="h-8 w-auto mr-2"
          />
          <span className="text-lg font-medium text-foreground">Bizo Чат</span>
        </div>
      </div>
      <div className="flex space-x-2 items-center">
        <ThemeToggle />
        <Link to={token ? `/admin?token=${token}` : "/admin"}>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button 
          onClick={onNewChat}
          variant="outline"
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Новый чат</span>
        </Button>
        
        {token && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Пользователь</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Аккаунт Bizo
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
