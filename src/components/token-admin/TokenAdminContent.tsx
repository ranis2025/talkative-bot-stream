import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import TokenList from "@/components/token-admin/TokenList";
import BotAssignmentList from "@/components/token-admin/BotAssignmentList";
import { TokenRecord, AssignedBot, getTokens, getAssignedBots, getAdminTokens } from "@/lib/tokenAdmin";
import { useToast } from "@/hooks/use-toast";

interface TokenAdminContentProps {
  adminRole: string | null;
  adminId: string | null;
}

const TokenAdminContent = ({
  adminRole,
  adminId
}: TokenAdminContentProps) => {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [refreshData, setRefreshData] = useState(0);
  const {
    toast
  } = useToast();

  useEffect(() => {
    if (adminRole) {
      fetchTokens();
      fetchAssignedBots();
    }
  }, [adminRole, refreshData, adminId]);

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      let data;
      if (adminRole === 'super_admin') {
        data = await getTokens();
      } else if (adminId) {
        data = await getAdminTokens(adminId);
      } else {
        data = [];
      }
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные токенов",
        variant: "destructive"
      });
      setTokens([{
        id: '1',
        token: 'AppName:User123',
        name: 'Test App',
        description: 'Test description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_id: null
      }]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchAssignedBots = async () => {
    try {
      setLoadingAssignments(true);
      const data = await getAssignedBots(adminId || undefined);
      setAssignedBots(data);
    } catch (error) {
      console.error("Error fetching token-bot assignments:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные назначений",
        variant: "destructive"
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const refreshAllData = () => {
    setRefreshData(prev => prev + 1);
  };

  return {
    tokens,
    setTokens,
    assignedBots,
    loadingTokens,
    loadingAssignments,
    fetchTokens,
    fetchAssignedBots,
    refreshAllData,
    content: <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Пользователи</CardTitle>
            <CardDescription>Управление токенами пользователей для доступа к API</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenList tokens={tokens} setTokens={setTokens} loadingTokens={loadingTokens} fetchTokens={fetchTokens} adminId={adminId} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Назначение ботов пользователям</CardTitle>
            <CardDescription>Управление связями между пользователями и их ботами</CardDescription>
          </CardHeader>
          <CardContent>
            <BotAssignmentList tokens={tokens} assignedBots={assignedBots} loadingAssignments={loadingAssignments} fetchAssignedBots={fetchAssignedBots} />
          </CardContent>
        </Card>
      </div>
  };
};

export default TokenAdminContent;
