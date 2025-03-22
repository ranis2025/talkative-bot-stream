import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface HeaderProps {
  onNewChat: () => void;
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onNewChat, isMobile, onToggleSidebar }: HeaderProps) {
  return (
    <div className="w-full flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-md z-10">
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
          className="h-8 mr-2" 
        />
      </div>
      <Button 
        onClick={onNewChat}
        variant="outline"
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Новый чат</span>
      </Button>
    </div>
  );
}
