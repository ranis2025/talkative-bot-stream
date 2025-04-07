
import React from "react";
import { Link, FileIcon } from "lucide-react";
import { extractFiles } from "@/lib/fileExtractor";

interface FileAttachmentsProps {
  content?: string;
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({ content }) => {
  const extractedFileLinks = content ? extractFiles(content) : [];
  
  if (extractedFileLinks.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1 mb-2">
        <Link className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Файлы из ответа:</span>
      </div>
      
      {extractedFileLinks.map((file, index) => (
        <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors">
          <FileIcon className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{file.text}</div>
          </div>
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
          >
            Открыть
          </a>
        </div>
      ))}
    </div>
  );
};
