
import React, { RefObject } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileInputButtonProps {
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileInputButton: React.FC<FileInputButtonProps> = ({ fileInputRef, handleFileChange }) => {
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
        <span className="sr-only">Прикрепить файл</span>
      </Button>
    </>
  );
};
