
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { executeCustomQuery } from "@/lib/tokenAdmin/api";

type CustomQueryCardProps = {
  defaultQuery?: string;
};

const CustomQueryCard = ({ defaultQuery = "SELECT * FROM admin_roles" }: CustomQueryCardProps) => {
  const [sqlQuery, setSqlQuery] = useState(defaultQuery);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const { toast } = useToast();

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
      // Execute the custom query using our API function
      const results = await executeCustomQuery(sqlQuery);
      
      if (Array.isArray(results) && results.length > 0) {
        // Extract column names from the first result
        setQueryColumns(Object.keys(results[0]));
        setQueryResults(results);
      } else {
        setQueryColumns([]);
        setQueryResults([]);
        toast({
          title: "Query executed",
          description: "No results returned or query was not a SELECT statement",
        });
      }
    } catch (error: any) {
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
  );
};

export default CustomQueryCard;
