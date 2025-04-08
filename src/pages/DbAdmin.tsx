
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database } from "lucide-react";

const DbAdmin = () => {
  const [magicToken, setMagicToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [botResults, setBotResults] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
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

      // Combine results with source information
      const combinedResults = [
        ...(chatBots || []).map((bot: any) => ({ ...bot, source: 'chat_bots' })),
        ...(assignedBots || []).map((bot: any) => ({ ...bot, source: 'token_bot_assignments' }))
      ];

      setBotResults(combinedResults);
      toast({
        title: "Search completed",
        description: `Found ${combinedResults.length} bots for token ${magicToken}`,
      });

    } catch (error) {
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

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Query required",
        description: "Please enter an SQL query to execute",
        variant: "destructive",
      });
      return;
    }

    setIsQueryLoading(true);
    try {
      // Execute the custom query using rpc
      const { data, error } = await supabase.rpc('execute_query', {
        query_text: sqlQuery
      });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        // Extract column names from the first result
        setQueryColumns(Object.keys(data[0]));
        setQueryResults(data);
      } else {
        setQueryColumns([]);
        setQueryResults([]);
        toast({
          title: "Query executed",
          description: "No results returned or query was not a SELECT statement",
        });
      }
    } catch (error) {
      console.error("Error executing query:", error);
      toast({
        title: "Error executing query",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsQueryLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Database className="h-8 w-8" /> Database Admin Panel
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Magic Token Lookup */}
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

        {/* Custom SQL Query */}
        <Card>
          <CardHeader>
            <CardTitle>Execute Custom SQL Query</CardTitle>
            <CardDescription>
              Run custom SQL queries against the database (SELECT only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea 
                  id="sql-query"
                  placeholder="SELECT * FROM access_tokens LIMIT 10;" 
                  value={sqlQuery} 
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={5}
                />
              </div>
              <Button onClick={executeQuery} disabled={isQueryLoading} className="w-full">
                {isQueryLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Execute Query
              </Button>

              {queryResults.length > 0 && (
                <div className="rounded-md border mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryColumns.map((column, index) => (
                          <TableHead key={index}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResults.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {queryColumns.map((column, colIndex) => (
                            <TableCell key={colIndex} className="truncate max-w-[200px]">
                              {typeof row[column] === 'object' 
                                ? JSON.stringify(row[column]) 
                                : String(row[column] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DbAdmin;
