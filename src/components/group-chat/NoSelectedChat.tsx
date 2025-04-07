
export function NoSelectedChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-medium">Добро пожаловать в Групповой Чат</h2>
        <p className="text-muted-foreground">
          Создайте новый групповой чат или выберите существующий, чтобы начать общение с несколькими ботами.
        </p>
      </div>
    </div>
  );
}
