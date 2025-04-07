
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, ArrowLeft, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

interface TokenRecord {
  id: string;
  token: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface AssignedBot {
  id: string;
  token_id: string;
  bot_id: string;
  bot_name: string;
  created_at: string;
}

const TokenAdmin = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState({ name: "", description: "" });
  const [newAssignment, setNewAssignment] = useState({ token_id: "", bot_id: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  // Ensure token is preserved in URL
  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/token-admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  // Fetch tokens and bots data
  useEffect(() => {
    if (token) {
      fetchTokens();
      fetchBots();
      fetchAssignedBots();
    }
  }, [token]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные токенов",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_bots')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error("Error fetching bots:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные ботов",
        variant: "destructive"
      });
    }
  };

  const fetchAssignedBots = async () => {
    try {
      const { data, error } = await supabase
        .from('token_bots')
        .select('*, bot:bot_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the response to include bot_name
      const formattedData = data.map((item: any) => ({
        id: item.id,
        token_id: item.token_id,
        bot_id: item.bot_id,
        bot_name: item.bot?.name || 'Unknown Bot',
        created_at: item.created_at
      }));
      
      setAssignedBots(formattedData);
    } catch (error) {
      console.error("Error fetching token-bot assignments:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные назначений",
        variant: "destructive"
      });
    }
  };

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
      const { error } = await supabase
        .from('tokens')
        .update({
          name: tokenRecord.name,
          description: tokenRecord.description
        })
        .eq('id', tokenRecord.id);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Токен обновлен",
      });
      
      fetchTokens();
    } catch (error) {
      console.error("Error updating token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить токен",
        variant: "destructive"
      });
    }
  };

  const generateToken = (name?: string) => {
    // Generate a token in format AppName:UserID
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
      
      const { error } = await supabase
        .from('tokens')
        .insert([{
          token: tokenValue,
          name: newToken.name,
          description: newToken.description || null
        }]);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Новый токен добавлен",
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

  const deleteToken = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот токен?")) return;
    
    try {
      const { error } = await supabase
        .from('tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Токен удален",
      });
      
      fetchTokens();
      fetchAssignedBots(); // Refresh assignments as they might have been deleted by cascade
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить токен",
        variant: "destructive"
      });
    }
  };

  const assignBotToToken = async () => {
    if (!newAssignment.token_id || !newAssignment.bot_id) {
      toast({
        title: "Ошибка",
        description: "Выберите токен и бота",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if this assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('token_bots')
        .select('*')
        .eq('token_id', newAssignment.token_id)
        .eq('bot_id', newAssignment.bot_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAssignment) {
        toast({
          title: "Предупреждение",
          description: "Этот бот уже назначен данному токену",
        });
        return;
      }

      const { error } = await supabase
        .from('token_bots')
        .insert([{
          token_id: newAssignment.token_id,
          bot_id: newAssignment.bot_id
        }]);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Бот назначен токену",
      });
      
      setNewAssignment({ token_id: "", bot_id: "" });
      fetchAssignedBots();
    } catch (error) {
      console.error("Error assigning bot to token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить бота токену",
        variant: "destructive"
      });
    }
  };

  const removeAssignment = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это назначение?")) return;
    
    try {
      const { error } = await supabase
        .from('token_bots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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
        toast({
          title: "Скопировано",
          description: "Токен скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать токен: ", err);
      }
    );
  };

  const handleBackToChat = () => {
    navigate(token ? `/chat?token=${token}` : '/chat');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление токенами</h1>
        <Button onClick={handleBackToChat} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Вернуться к чату
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens Management */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Токены доступа</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Токен</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((tokenRecord, index) => (
                    <TableRow key={tokenRecord.id}>
                      <TableCell>
                        <Input 
                          value={tokenRecord.name} 
                          onChange={(e) => handleTokenChange(index, 'name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <div className="truncate max-w-[140px]">{tokenRecord.token}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(tokenRecord.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={tokenRecord.description || ''} 
                          onChange={(e) => handleTokenChange(index, 'description', e.target.value)}
                          placeholder="Описание"
                        />
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button size="sm" onClick={() => saveToken(tokenRecord)}>
                          <Save className="h-4 w-4 mr-1" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteToken(tokenRecord.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Добавить новый токен</h3>
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
                Добавить токен
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token-Bot Assignments */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Назначение ботов токенам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Добавить назначение</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <select 
                  className="border rounded px-3 py-2 w-full bg-background"
                  value={newAssignment.token_id}
                  onChange={(e) => setNewAssignment(prev => ({...prev, token_id: e.target.value}))}
                >
                  <option value="">Выберите токен</option>
                  {tokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.name} ({token.token})
                    </option>
                  ))}
                </select>
                
                <select 
                  className="border rounded px-3 py-2 w-full bg-background"
                  value={newAssignment.bot_id}
                  onChange={(e) => setNewAssignment(prev => ({...prev, bot_id: e.target.value}))}
                >
                  <option value="">Выберите бота</option>
                  {bots.map(bot => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name} ({bot.bot_id})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={assignBotToToken}>
                <Plus className="h-4 w-4 mr-2" />
                Назначить бота
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Токен</TableHead>
                  <TableHead>Бот</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedBots.map((assignment) => {
                  const token = tokens.find(t => t.id === assignment.token_id);
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>{token?.name || 'Unknown Token'}</TableCell>
                      <TableCell>{assignment.bot_name}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removeAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {assignedBots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Нет назначений
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenAdmin;
