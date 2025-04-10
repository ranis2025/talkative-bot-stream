
import { Button } from "@/components/ui/button";
import { TokenRecord, assignBotToToken } from "@/lib/tokenAdmin";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  token_id: z.string().min(1, "Выберите токен"),
  bot_id: z.string().min(1, "ID бота обязателен"),
  bot_token: z.string().min(1, "Токен бота обязателен"),
  bot_name: z.string().min(1, "Название бота обязательно"),
});

interface BotAssignmentFormProps {
  tokens: TokenRecord[];
  onSuccess: () => void;
  onClose: () => void;
}

const BotAssignmentForm = ({ tokens, onSuccess, onClose }: BotAssignmentFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token_id: "",
      bot_id: "",
      bot_token: "",
      bot_name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Submitting form with values:', values);
      
      const selectedToken = tokens.find(t => t.id === values.token_id);
      if (selectedToken) {
        console.log('Selected token:', selectedToken);
      }
      
      const result = await assignBotToToken(
        values.token_id, 
        values.bot_id, 
        values.bot_token, 
        values.bot_name
      );
      
      console.log('Bot assignment result:', result);
      
      toast({
        title: "Успешно",
        description: `Бот "${values.bot_name}" назначен токену`,
      });
      
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning bot to token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить бота токену",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="token_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пользователь</FormLabel>
              <select 
                className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  const tokenId = e.target.value;
                  console.log('Token selected:', tokenId);
                  const selectedToken = tokens.find(t => t.id === tokenId);
                  if (selectedToken) {
                    console.log('Selected token details:', selectedToken);
                  }
                }}
              >
                <option value="">Выберите пользователя</option>
                {tokens.map(token => (
                  <option key={token.id} value={token.id}>
                    {token.name} ({token.token})
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bot_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Бота</FormLabel>
              <FormControl>
                <Input placeholder="Введите ID бота" {...field} />
              </FormControl>
              <FormDescription>
                Уникальный идентификатор бота в системе
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bot_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Токен Бота</FormLabel>
              <FormControl>
                <Input placeholder="Введите токен бота" {...field} />
              </FormControl>
              <FormDescription>
                Секретный токен для API доступа бота
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bot_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название Бота</FormLabel>
              <FormControl>
                <Input placeholder="Введите название бота" {...field} />
              </FormControl>
              <FormDescription>
                Отображаемое имя бота
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Назначить</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default BotAssignmentForm;
