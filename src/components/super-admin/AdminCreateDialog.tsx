
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminCreateDialogProps {
  onAdminCreated: () => void;
}

const AdminCreateDialog = ({ onAdminCreated }: AdminCreateDialogProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setFormError("");
  };

  const handleCreateAdmin = async () => {
    if (!username || !password) {
      setFormError("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("admin_roles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      
      if (existingUser) {
        setFormError("Администратор с таким именем уже существует");
        return;
      }
      
      // Create new admin
      const { error } = await supabase
        .from("admin_roles")
        .insert({
          username,
          password,
          role: "admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Администратор создан",
        description: `Администратор ${username} успешно создан`
      });
      
      // Reset form
      resetForm();
      
      // Refresh admin list
      onAdminCreated();
      
      // Close dialog (will be handled by the DialogClose component)
      
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать администратора",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Создать нового администратора
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать администратора</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {formError && (
            <div className="text-destructive text-sm">{formError}</div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button onClick={handleCreateAdmin}>Создать</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateDialog;
