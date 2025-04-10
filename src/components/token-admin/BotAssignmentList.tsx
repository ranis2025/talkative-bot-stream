
import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Info, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TokenRecord, AssignedBot, removeAssignment } from "@/lib/tokenAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BotAssignmentForm from "./BotAssignmentForm";

interface BotAssignmentListProps {
  tokens: TokenRecord[];
  assignedBots: AssignedBot[];
  loadingAssignments: boolean;
  fetchAssignedBots: () => Promise<void>;
}

const BotAssignmentList = ({ 
  tokens, 
  assignedBots, 
  loadingAssignments, 
  fetchAssignedBots 
}: BotAssignmentListProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { toast } = useToast();

  const removeAssignmentHandler = async (id: string) => {
    try {
      await removeAssignment(id);
      
      toast({
        title: "Успешно",
        description: "Назначение удалено",
      });
      
      fetchAssignedBots();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить назначение",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
        
        toast({
          title: "Скопировано",
          description: "Токен скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать токен: ", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать токен",
          variant: "destructive"
        });
      }
    );
  };

  return (
    <div className="mb-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Назначить бота
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Назначить бота пользователю</DialogTitle>
            <DialogDescription>
              Свяжите бота с пользователем для доступа к API.
            </DialogDescription>
          </DialogHeader>
          <BotAssignmentForm 
            tokens={tokens} 
            onSuccess={fetchAssignedBots} 
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {loadingAssignments ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Бот</TableHead>
                <TableHead>Токен бота</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedBots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Нет назначений ботов к пользователям
                  </TableCell>
                </TableRow>
              ) : (
                assignedBots.map((assignment) => {
                  const token = tokens.find(t => t.id === assignment.token_id);
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">{token?.name || 'Неизвестный токен'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {token?.token}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.bot_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {assignment.bot_id}</div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <div className="truncate max-w-[120px] text-sm font-mono">
                            {assignment.bot_token}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => copyToClipboard(assignment.bot_token || '')}
                                className="h-8 w-8"
                                disabled={!assignment.bot_token}
                              >
                                {copiedToken === assignment.bot_token ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Скопировать токен бота</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удаление назначения</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить связь между ботом "{assignment.bot_name}" и пользователем? 
                                Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeAssignmentHandler(assignment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      <div className="flex items-center p-4 bg-muted/50 rounded-md mt-4">
        <Info className="h-5 w-5 mr-2 text-blue-500" />
        <p className="text-sm">
          Каждый Magic токен авторизации может быть связан с несколькими ботами. 
          При удалении токена все его назначения ботам также будут удалены.
        </p>
      </div>
    </div>
  );
};

export default BotAssignmentList;
