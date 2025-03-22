
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-medium">Страница не найдена</h2>
            <p className="text-muted-foreground">
              Страница, которую вы ищете, не существует или была перемещена.
            </p>
          </div>
          <Button asChild className="animate-pulse-slow">
            <a href="/">Вернуться на главную</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
