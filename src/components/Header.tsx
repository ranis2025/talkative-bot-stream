
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onNewChat: () => void;
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onNewChat, isMobile, onToggleSidebar }: HeaderProps) {
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
        <img 
          src="/logo.png" 
          alt="ProTalk Logo" 
          className="h-9.2" /* Increased from h-8 to h-9.2 (15% larger) */
        />
      </div>
      <div className="flex space-x-2">
        <ThemeToggle />
        <Link to="/admin">
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
      </div>
    </div>
  );
}
