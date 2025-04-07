
import { CheckCircle, Clock } from "lucide-react";

interface MessageTimestampProps {
  isBot: boolean;
  formattedTime: string;
}

export function MessageTimestamp({ isBot, formattedTime }: MessageTimestampProps) {
  return (
    <div className="text-xs text-muted-foreground flex items-center">
      {isBot ? (
        <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
      ) : (
        <Clock className="h-3 w-3 mr-1" />
      )}
      {formattedTime}
    </div>
  );
}
