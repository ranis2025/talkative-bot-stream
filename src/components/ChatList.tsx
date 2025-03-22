
import { IChat, ChatBot } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare, Edit2, Trash2, Check, X, Users } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatListProps {
  chats: IChat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  userBots: ChatBot[];
  currentBot: string | null;
  onSelectBot: (botId: string) => void;
  chatView: 'individual' | 'group';
}

export function ChatList({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onDeleteChat, 
  onRenameChat,
  userBots,
  currentBot,
  onSelectBot,
  chatView
}: ChatListProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Начать редактирование
  const startEditing = (chat: IChat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  // Сохранить изменения
  const saveEdit = () => {
    if (editingChatId && editTitle.trim()) {
      onRenameChat(editingChatId, editTitle);
      setEditingChatId(null);
    }
  };

  // Отменить редактирование
  const cancelEdit = () => {
    setEditingChatId(null);
  };

  // Обработка нажатия Enter для сохранения
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="w-full overflow-y-auto">
      {chatView === 'individual' && userBots.length > 0 && (
        <div className="p-3">
          <Select
            value={currentBot || ""}
            onValueChange={(value) => onSelectBot(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите бота" />
            </SelectTrigger>
            <SelectContent>
              {userBots.map((bot) => (
                <SelectItem key={bot.bot_id} value={bot.bot_id}>
                  {bot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {chats.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          {chatView === 'group' ? 'Нет групповых чатов' : 'Нет активных чатов'}
        </div>
      ) : (
        <ul className="space-y-1 p-2">
          {chats.map((chat) => (
            <li key={chat.id}>
              <div 
                className={cn(
                  "flex items-center group justify-between p-2 rounded-md transition-all",
                  currentChatId === chat.id 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                {editingChatId === chat.id ? (
                  <div className="flex items-center space-x-2 w-full">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="h-8 text-sm flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={saveEdit}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex items-center text-left flex-1 min-w-0"
                      onClick={() => onSelectChat(chat.id)}
                    >
                      {chat.is_group_chat ? (
                        <Users className="h-4 w-4 mr-2 shrink-0" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <span>{chat.title}</span>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(chat.updatedAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => startEditing(chat)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => onDeleteChat(chat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
