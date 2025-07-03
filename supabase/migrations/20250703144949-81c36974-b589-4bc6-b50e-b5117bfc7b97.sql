-- Create message_status table for tracking asynchronous message processing
CREATE TABLE public.message_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

-- Create policies for message status access
CREATE POLICY "Allow all access to message_status" 
ON public.message_status 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_message_status_message_id ON public.message_status(message_id);
CREATE INDEX idx_message_status_chat_id ON public.message_status(chat_id);
CREATE INDEX idx_message_status_status ON public.message_status(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_message_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_message_status_updated_at
  BEFORE UPDATE ON public.message_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_status_updated_at();