
import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Plus, Trash2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  TokenRecord, 
  addToken, 
  updateToken, 
  deleteToken
} from "@/lib/tokenAdmin";
import { v4 as uuidv4 } from "uuid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenListProps {
  tokens: TokenRecord[];
  setTokens: React.Dispatch<React.SetStateAction<TokenRecord[]>>;
  loadingTokens: boolean;
  fetchTokens: () => Promise<void>;
}

const TokenList = ({ tokens, setTokens, loadingTokens, fetchTokens }: TokenListProps) => {
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewToken(prev => ({ ...prev, [name]: value }));
  };

  const handleTokenChange = (index: number, field: string, value: string) => {
    const updatedTokens = [...tokens];
    updatedTokens[index] = { ...updatedTokens[index], [field]: value };
    setTokens(updatedTokens);
  };

  const saveToken = async (tokenRecord: TokenRecord) => {
    try {
      setSaving(tokenRecord.id);
      await updateToken(tokenRecord.id, tokenRecord.name, tokenRecord.description);
      
      toast({
        title: "Успешно",
        description: "Токен обновлен",
      });
      
      setSaving(null);
      fetchTokens();
    } catch (error) {
      console.error("Error updating token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить токен",
        variant: "destructive"
      });
      setSaving(null);
    }
  };

  const generateToken = (name?: string) => {
    const appName = name?.replace(/\s+/g, '') || 'App';
    const userId = uuidv4().slice(0, 8);
    return `${appName}:${userId}`;
  };

  const addNewToken = async () => {
    if (!newToken.name) {
      toast({
        title: "Ошибка",
        description: "Название токена обязательно",
        variant: "destructive"
      });
      return;
    }

    try {
      const tokenValue = generateToken(newToken.name);
      
      await addToken(tokenValue, newToken.name, newToken.description);
      
      toast({
        title: "Успешно",
        description: "Новый Magic токен добавлен",
      });
      
      setNewToken({ name: "", description: "" });
      fetchTokens();
    } catch (error) {
      console.error("Error adding token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить токен",
        variant: "destructive"
      });
    }
  };

  const deleteTokenHandler = async (id: string) => {
    try {
      await deleteToken(id);
      
      toast({
        title: "Успешно",
        description: "Токен удален",
      });
      
      fetchTokens();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить токен",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
        
        toast({
          title: "Скопировано",
          description: "Токен скопирован в буфер обмена",
        });
      })
      .catch((err) => {
        console.error("Не удалось скопировать токен: ", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать токен",
          variant: "destructive"
        });
      });
  };

  if (loadingTokens) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Название</TableHead>
              <TableHead className="w-1/3">Токен</TableHead>
              <TableHead className="w-1/4">Описание</TableHead>
              <TableHead className="text-right w-1/6">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Нет доступных Magic токенов
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((tokenRecord, index) => (
                <TableRow key={tokenRecord.id}>
                  <TableCell>
                    <Input 
                      value={tokenRecord.name} 
                      onChange={(e) => handleTokenChange(index, 'name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm bg-muted p-2 rounded-md overflow-hidden overflow-ellipsis w-full max-w-[220px]">
                        {tokenRecord.token}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyToClipboard(tokenRecord.token)}
                        className="h-8 w-8 flex-shrink-0"
                        aria-label="Скопировать токен"
                      >
                        {copiedToken === tokenRecord.token ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={tokenRecord.description || ''} 
                      onChange={(e) => handleTokenChange(index, 'description', e.target.value)}
                      placeholder="Описание"
                    />
                  </TableCell>
                  <TableCell className="flex justify-end space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => saveToken(tokenRecord)}
                      disabled={saving === tokenRecord.id}
                    >
                      {saving === tokenRecord.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Сохранить
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удаление токена</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить токен "{tokenRecord.name}"? 
                            Это действие нельзя отменить, и все связанные с этим токеном назначения будут также удалены.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteTokenHandler(tokenRecord.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Добавить новый Magic токен</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input 
            name="name"
            value={newToken.name}
            onChange={handleInputChange}
            placeholder="Название приложения"
          />
          <Input 
            name="description"
            value={newToken.description}
            onChange={handleInputChange}
            placeholder="Описание (опционально)"
          />
        </div>
        <Button onClick={addNewToken} className="mt-3">
          <Plus className="h-4 w-4 mr-2" />
          Добавить Magic токен
        </Button>
      </div>
    </>
  );
};

export default TokenList;
