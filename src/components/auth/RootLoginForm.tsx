
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2 } from "lucide-react";

interface RootLoginFormProps {
  onSubmit: (username: string, password: string) => void;
  isLoading: boolean;
  error: string;
}

const RootLoginForm = ({ onSubmit, isLoading, error }: RootLoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="text" 
          placeholder="Root имя пользователя" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Input 
          type="password" 
          placeholder="Root пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      <Button type="submit" className="w-full flex items-center justify-center" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
        Войти как Super Admin
      </Button>
    </form>
  );
};

export default RootLoginForm;
