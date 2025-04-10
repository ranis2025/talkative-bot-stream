import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
interface TokenAdminHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
  onBackToChat: () => void;
}
const TokenAdminHeader = ({
  onRefresh,
  onLogout,
  onBackToChat
}: TokenAdminHeaderProps) => {
  return <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Управление пользователями</h1>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline">
          Обновить данные
        </Button>
        <Button onClick={onLogout} variant="outline" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Выйти из админ-панели
        </Button>
        <Button onClick={onBackToChat} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Вернуться к чату
        </Button>
      </div>
    </div>;
};
export default TokenAdminHeader;