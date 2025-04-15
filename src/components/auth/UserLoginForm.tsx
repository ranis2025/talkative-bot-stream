
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2 } from "lucide-react";

interface UserLoginFormProps {
  onSubmit: (login: string, password: string) => void;
  isLoading: boolean;
  error: string;
}

const UserLoginForm = ({ onSubmit, isLoading, error }: UserLoginFormProps) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(login, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="text" 
          placeholder="Введите ваш логин" 
          value={login} 
          onChange={e => setLogin(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Input 
          type="password" 
          placeholder="Введите ваш пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="w-[48%]">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
          Войти
        </Button>
        <Button type="submit" disabled={isLoading} className="w-[48%] bg-fuchsia-600 hover:bg-fuchsia-500">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
          Регистрация
        </Button>
      </div>
    </form>
  );
};

export default UserLoginForm;
