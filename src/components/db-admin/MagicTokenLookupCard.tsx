
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      // Fetch bots from chat_bots table
      const { data: chatBots, error: chatBotsError } = await supabase
        .from('chat_bots')
        .select('*')
        .eq('token', magicToken);

      if (chatBotsError) {
        throw chatBotsError;
      }

      // Get token ID from access_tokens table
      const { data: tokenData, error: tokenError } = await supabase
        .from('access_tokens')
        .select('id')
        .eq('token', magicToken)
        .maybeSingle();

      if (tokenError) {
        throw tokenError;
      }

      // If token exists, also fetch from token_bot_assignments
      let assignedBots: any[] = [];
      if (tokenData?.id) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('token_bot_assignments')
          .select('*')
          .eq('token_id', tokenData.id);

        if (assignmentsError) {
          throw assignmentsError;
        }

        assignedBots = assignments || [];
      }

      // Combine results with a standardized source of "chat_bots"
      const combinedResults = [
        ...(chatBots || []).map((bot: any) => ({ ...bot, source: 'chat_bots' })),
        ...(assignedBots || []).map((bot: any) => ({ ...bot, source: 'assignments' }))
      ];

      setBotResults(combinedResults);
      toast({
        title: "Search completed",
        description: `Found ${combinedResults.length} bots for token ${magicToken}`,
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
          Enter a magic token to find all associated bots in both tables
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
                    <TableHead>Source</TableHead>
                    <TableHead>Bot ID</TableHead>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Bot Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {botResults.map((bot, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{bot.source}</TableCell>
                      <TableCell>{bot.bot_id}</TableCell>
                      <TableCell>{bot.bot_name || bot.name}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{bot.bot_token}</TableCell>
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
