
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { MessageSquare, Plus, Users, LogOut, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNewChat?: () => void;
  showNewChatButton?: boolean;
  onNewGroupChat?: () => void;
  showNewGroupChatButton?: boolean;
}

export function Header({
  title = "ProTalk чат",
  subtitle,
  onNewChat,
  showNewChatButton = false,
  onNewGroupChat,
  showNewGroupChatButton = false,
}: HeaderProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleNewGroupChat = () => {
    if (onNewGroupChat) {
      onNewGroupChat();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="border-b bg-card/50 sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold whitespace-nowrap">{title}</span>
          </div>
          {subtitle && (
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showNewChatButton && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block">Новый чат</span>
            </Button>
          )}
          {showNewGroupChatButton && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={handleNewGroupChat}
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline-block">Новый групповой чат</span>
            </Button>
          )}
          <Link to="/profile">
            <Button size="sm" variant="ghost" className="h-8">
              <User className="h-4 w-4 mr-1" />
              <span className="hidden md:inline-block">{user?.username || "Профиль"}</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline-block">Выйти</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
