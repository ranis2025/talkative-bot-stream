
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryWithRetry } from "@/lib/supabaseRetry";

const MagicTokenLookupCard = () => {
  const [magicToken, setMagicToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [botResults, setBotResults] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchBotsByToken = async () => {
    if (!magicToken) {
      toast({
        title: "Token required",
        description: "Please enter a magic token to search",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get token ID from access_tokens table
      const tokenResult = await queryWithRetry(async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        return await supabase
          .from('access_tokens')
          .select('id')
          .eq('token', magicToken as any)
          .maybeSingle();
      });

      if (tokenResult.error) {
        throw tokenResult.error;
      }

      // Initialize results array
      let bots: any[] = [];

      // If token exists in access_tokens, fetch assigned bots
      if (tokenResult.data && 'id' in tokenResult.data && tokenResult.data.id) {
        const assignmentsResult = await queryWithRetry(async () => {
          const { supabase } = await import("@/integrations/supabase/client");
          return await supabase
            .from('token_bot_assignments')
            .select('*')
            .eq('token_id', (tokenResult.data as any).id);
        });

        if (assignmentsResult.error) {
          throw assignmentsResult.error;
        }

        if (assignmentsResult.data && Array.isArray(assignmentsResult.data)) {
          bots = assignmentsResult.data.map((assignment: any) => ({
            bot_id: assignment.bot_id,
            bot_name: assignment.bot_name,
            bot_token: assignment.bot_token,
            source: 'assignments'
          }));
        }
      }

      // Fetch bots from chat_bots table that aren't already in the results
      const chatBotsResult = await queryWithRetry(async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        return await supabase
          .from('chat_bots')
          .select('*')
          .eq('token', magicToken as any);
      });

      if (chatBotsResult.error) {
        throw chatBotsResult.error;
      }

      if (chatBotsResult.data && Array.isArray(chatBotsResult.data)) {
        // Add only unique bots that aren't already in the results
        chatBotsResult.data.forEach((chatBot: any) => {
          const existingBot = bots.find(b => b.bot_id === chatBot.bot_id);
          if (!existingBot) {
            bots.push({
              bot_id: chatBot.bot_id,
              bot_name: chatBot.name,
              bot_token: chatBot.bot_token,
              source: 'chat_bots'
            });
          }
        });
      }

      setBotResults(bots);
      toast({
        title: "Search completed",
        description: `Found ${bots.length} unique bots for token ${magicToken}`,
      });

    } catch (error: any) {
      console.error("Error fetching bots:", error);
      toast({
        title: "Error fetching bots",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Bots by Magic Token</CardTitle>
        <CardDescription>
          Enter a magic token to find all associated bots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input 
              placeholder="Enter magic token" 
              value={magicToken} 
              onChange={(e) => setMagicToken(e.target.value)}
            />
            <Button onClick={fetchBotsByToken} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Search
            </Button>
          </div>

          {botResults.length > 0 && (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot ID</TableHead>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Bot Token</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {botResults.map((bot, index) => (
                    <TableRow key={`${bot.bot_id}-${index}`}>
                      <TableCell>{bot.bot_id}</TableCell>
                      <TableCell>{bot.bot_name}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{bot.bot_token}</TableCell>
                      <TableCell>{bot.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MagicTokenLookupCard;
