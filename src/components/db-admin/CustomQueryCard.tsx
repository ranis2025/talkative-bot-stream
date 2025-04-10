
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { executeCustomQuery } from "@/lib/tokenAdmin";

interface CustomQueryCardProps {
  defaultQuery?: string;
}

const CustomQueryCard = ({ defaultQuery = "SELECT * FROM admin_tokens_view LIMIT 50" }: CustomQueryCardProps) => {
  const [query, setQuery] = useState(defaultQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Введите запрос",
        description: "Пожалуйста, введите SQL запрос для выполнения",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await executeCustomQuery(query);

      if (Array.isArray(data) && data.length > 0) {
        setColumns(Object.keys(data[0]));
        setResults(data);
        toast({
          title: "Запрос выполнен",
          description: `Получено ${data.length} записей`,
        });
      } else {
        setColumns([]);
        setResults([]);
        toast({
          title: "Запрос выполнен",
          description: "Запрос выполнен, но не вернул данных",
        });
      }
    } catch (err: any) {
      console.error("Error executing query:", err);
      setError(err.message || "Ошибка выполнения запроса");
      toast({
        title: "Ошибка",
        description: err.message || "Ошибка выполнения запроса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Произвольный SQL запрос</CardTitle>
        <CardDescription>
          Выполните SQL запросы для анализа данных в базе
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Введите SQL запрос (только SELECT)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px] font-mono text-sm"
          />
          
          <div className="flex justify-between">
            <Button 
              variant="default" 
              onClick={() => setQuery("SELECT * FROM admin_tokens_view LIMIT 50")}
            >
              Показать связь админов и токенов
            </Button>
            
            <Button onClick={executeQuery} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Выполнение...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Выполнить запрос
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <ScrollArea className="h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column, index) => (
                      <TableHead key={index} className="whitespace-nowrap font-medium">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={`${rowIndex}-${colIndex}`} className="truncate max-w-[200px]">
                          {row[column] !== null ? String(row[column]) : 'NULL'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {results.length === 0 && !isLoading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              Выполните запрос для получения результатов
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomQueryCard;
