export interface PendingMessage {
  id: string;
  content: string;
  files?: { name: string; size: number; type: string; url: string; }[];
  status: 'sending' | 'pending' | 'processing' | 'completed' | 'error';
  messageId?: string; // Pro-Talk API message ID
  error?: string;
  timestamp: number;
  botId?: string;
  retryCount?: number;
}

export interface MessageStatusMap {
  [messageLocalId: string]: PendingMessage;
}