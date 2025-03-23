import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, ArrowLeft, Copy, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

interface ChatBot {
  id: string;
  name: string;
  bot_id: string;
  bot_token: string | null;
  openai_key: string | null;
  created_at: string;
  updated_at: string;
  token: string | null;
}

interface TokenEntry {
  id: string;
  token: string;
  theme: string;
  created_at: string;
  user_id: string;
}

const Admin = () => {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [newBot, setNewBot] = useState({ name: "", bot_id: "", bot_token: "", openai_key: "" });
  const [newToken, setNewToken] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (token && !searchParams.get("token")) {
      navigate(`/admin?token=${token}`, { replace: true });
    }
  }, [token, searchParams, navigate]);

  useEffect(() => {
    if (token) {
      fetchBots();
      fetchTokens();
    }
  }, [token]);

  const fetchBots = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_bots')
        .select('*')
        .eq('token', token)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error("Error fetching bots:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные ботов",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      const { data, error } = await supabase
        .from('user_settings')
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
      setLoadingTokens(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBot(prev => ({ ...prev, [name]: value }));
  };

  const handleBotChange = (index: number, field: string, value: string) => {
    const updatedBots = [...bots];
    updatedBots[index] = { ...updatedBots[index], [field]: value };
    setBots(updatedBots);
  };

  const saveBot = async (bot: ChatBot) => {
    try {
      const { error } = await supabase
        .from('chat_bots')
        .update({
          name: bot.name,
          bot_id: bot.bot_id,
          bot_token: bot.bot_token,
          openai_key: bot.openai_key,
          token: token
        })
        .eq('id', bot.id);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Бот обновлен",
      });
      
      fetchBots();
    } catch (error) {
      console.error("Error updating bot:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить бота",
        variant: "destructive"
      });
    }
  };

  const addNewBot = async () => {
    if (!token) return;
    
    if (!newBot.name || !newBot.bot_id) {
      toast({
        title: "Ошибка",
        description: "Название и ID бота обязательны",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_bots')
        .insert([{
          name: newBot.name,
          bot_id: newBot.bot_id,
          bot_token: newBot.bot_token || null,
          openai_key: newBot.openai_key || null,
          token: token
        }]);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Новый бот добавлен",
      });
      
      setNewBot({ name: "", bot_id: "", bot_token: "", openai_key: "" });
      fetchBots();
    } catch (error) {
      console.error("Error adding bot:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить бота",
        variant: "destructive"
      });
    }
  };

  const deleteBot = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого бота?")) return;
    
    try {
      const { error } = await supabase
        .from('chat_bots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Бот удален",
      });
      
      fetchBots();
    } catch (error) {
      console.error("Error deleting bot:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить бота",
        variant: "destructive"
      });
    }
  };

  const handleBackToChat = () => {
    navigate(token ? `/chat?token=${token}` : '/chat');
  };

  const generateNewToken = () => {
    setNewToken(uuidv4());
  };

  const createNewToken = async () => {
    if (!newToken) {
      generateNewToken();
      return;
    }

    try {
      const userId = uuidv4();
      const { error } = await supabase
        .from('user_settings')
        .insert([{
          token: newToken,
          theme: 'dark',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId
        }]);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Новый токен создан",
      });
      
      setNewToken("");
      fetchTokens();
    } catch (error) {
      console.error("Error creating token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать токен",
        variant: "destructive"
      });
    }
  };

  const copyToken = (tokenText: string) => {
    navigator.clipboard.writeText(tokenText);
    toast({
      title: "Скопировано",
      description: "Токен скопирован в буфер обмена",
    });
  };

  const deleteToken = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот токен? Это удалит все связанные данные.")) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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

  const cleanupGroupChats = async () => {
    try {
      const { error } = await supabase
        .from('protalk_chats')
        .delete()
        .is('token', null);

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Групповые чаты без токена удалены",
      });
    } catch (error) {
      console.error("Error cleaning up group chats:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить групповые чаты",
        variant: "destructive"
      });
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из панели администратора",
    });
    navigate(token ? `/chat?token=${token}` : '/auth');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <div className="flex gap-2">
          <Button onClick={handleBackToChat} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Вернуться к чату
          </Button>
          <Button onClick={handleAdminLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Выйти из админ-панели
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Управление токенами</h2>
        
        <div className="flex items-center gap-3 mb-6">
          <Input 
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="Новый токен"
            className="max-w-md"
          />
          <Button onClick={generateNewToken} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Сгенерировать
          </Button>
          <Button onClick={createNewToken} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>

        <div className="mb-4">
          <Button onClick={cleanupGroupChats} variant="outline" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Очистить групповые чаты без токена
          </Button>
        </div>
        
        {loadingTokens ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Токен</TableHead>
                <TableHead>ID пользователя</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((tokenEntry) => (
                <TableRow key={tokenEntry.id} className={token === tokenEntry.token ? "bg-primary/10" : ""}>
                  <TableCell className="font-mono text-xs overflow-hidden">
                    {tokenEntry.token}
                    {token === tokenEntry.token && <span className="ml-2 text-primary">(текущий)</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tokenEntry.user_id}</TableCell>
                  <TableCell>{tokenEntry.theme}</TableCell>
                  <TableCell>{new Date(tokenEntry.created_at).toLocaleString()}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => copyToken(tokenEntry.token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/chat?token=${tokenEntry.token}`)}
                    >
                      Использовать
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteToken(tokenEntry.id)}
                      disabled={token === tokenEntry.token}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Управление ботами</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>ID бота</TableHead>
                <TableHead>Токен бота</TableHead>
                <TableHead>OpenAI ключ</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.map((bot, index) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <Input 
                      value={bot.name} 
                      onChange={(e) => handleBotChange(index, 'name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={bot.bot_id} 
                      onChange={(e) => handleBotChange(index, 'bot_id', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={bot.bot_token || ''} 
                      onChange={(e) => handleBotChange(index, 'bot_token', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={bot.openai_key || ''} 
                      onChange={(e) => handleBotChange(index, 'openai_key', e.target.value)}
                      type="password"
                      placeholder="sk-..."
                    />
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button size="sm" onClick={() => saveBot(bot)}>
                      <Save className="h-4 w-4 mr-1" />
                      Сохранить
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteBot(bot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Добавить нового бота</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input 
              name="name"
              value={newBot.name}
              onChange={handleInputChange}
              placeholder="Название бота"
            />
            <Input 
              name="bot_id"
              value={newBot.bot_id}
              onChange={handleInputChange}
              placeholder="ID бота"
            />
            <Input 
              name="bot_token"
              value={newBot.bot_token}
              onChange={handleInputChange}
              placeholder="Токен бота (опционально)"
            />
            <Input 
              name="openai_key"
              value={newBot.openai_key}
              onChange={handleInputChange}
              placeholder="OpenAI ключ (опционально)"
              type="password"
            />
          </div>
          <Button onClick={addNewBot} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
