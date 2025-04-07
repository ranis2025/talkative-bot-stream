
import { useAuth } from "@/hooks/useAuth";
import { UserBotsList } from "@/components/UserBotsList";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  User, 
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";

const UserProfile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/chat">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Профиль пользователя</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 flex items-center border-b">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">{user?.username}</h2>
                {user?.email && (
                  <p className="text-muted-foreground mt-1">{user.email}</p>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Дата регистрации</p>
                  <p>{user?.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Последнее обновление</p>
                  <p>{user?.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm">
            <UserBotsList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
