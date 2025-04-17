
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserLoginForm from "@/components/auth/UserLoginForm";
import AdminLoginForm from "@/components/auth/AdminLoginForm";
import RootLoginForm from "@/components/auth/RootLoginForm";
import { useAuthPage } from "@/hooks/useAuthPage";
import { useLocation } from "react-router-dom";

const Auth = () => {
  const location = useLocation();
  const showRootTab = location.pathname.includes('/root');
  
  const {
    tokenLoading,
    loginError,
    adminError,
    rootError,
    handleLoginSubmit,
    handleAdminLogin,
    handleRootLogin
  } = useAuthPage();

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">Выполняется вход...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-lg border">
        <Tabs defaultValue="user" className="w-full">
          <TabsList className={`grid w-full ${showRootTab ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="user">Пользователь</TabsTrigger>
            <TabsTrigger value="admin">Администратор</TabsTrigger>
            {showRootTab && <TabsTrigger value="root">Root</TabsTrigger>}
          </TabsList>
          <TabsContent value="user">
            <CardContent className="pt-6">
              <UserLoginForm 
                onSubmit={handleLoginSubmit}
                isLoading={tokenLoading}
                error={loginError}
              />
            </CardContent>
          </TabsContent>
          <TabsContent value="admin">
            <CardContent className="pt-6">
              <AdminLoginForm 
                onSubmit={handleAdminLogin}
                isLoading={tokenLoading}
                error={adminError}
              />
            </CardContent>
          </TabsContent>
          {showRootTab && (
            <TabsContent value="root">
              <CardContent className="pt-6">
                <RootLoginForm 
                  onSubmit={handleRootLogin}
                  isLoading={tokenLoading}
                  error={rootError}
                />
              </CardContent>
            </TabsContent>
          )}
        </Tabs>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Войдите, чтобы получить доступ к чату
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
