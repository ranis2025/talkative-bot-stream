
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryWithRetry } from "@/lib/supabaseRetry";

interface AdminCreateDialogProps {
  onAdminCreated: () => void;
}

const AdminCreateDialog = ({ onAdminCreated }: AdminCreateDialogProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setFormError("");
    setIsCreating(false);
  };

  const handleCreateAdmin = async () => {
    if (!username || !password) {
      setFormError("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Check if username already exists
      const existingUserResult = await queryWithRetry(async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        return await supabase
          .from("admin_roles")
          .select("id")
          .eq("username", username as any)
          .maybeSingle();
      });
      
      if (existingUserResult.data) {
        setFormError("Администратор с таким именем уже существует");
        setIsCreating(false);
        return;
      }
      
      // Create new admin
      const createResult = await queryWithRetry(async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        return await supabase
          .from("admin_roles")
          .insert({
            username,
            password,
            role: "admin",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .select()
          .single();
      });
      
      if (createResult.error) throw createResult.error;
      
      const adminId = createResult.data && typeof createResult.data === 'object' && 'id' in createResult.data 
        ? (createResult.data as any).id 
        : 'unknown';
      
      console.log("Admin created successfully with ID:", adminId);
      
      toast({
        title: "Администратор создан",
        description: `Администратор ${username} успешно создан с ID: ${adminId}`
      });
      
      // Reset form
      resetForm();
      
      // Refresh admin list
      onAdminCreated();
      
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setFormError("Не удалось создать администратора");
      setIsCreating(false);
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
          <Button onClick={handleCreateAdmin} disabled={isCreating}>
            {isCreating ? "Создание..." : "Создать"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateDialog;
