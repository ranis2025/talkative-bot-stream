
import React from 'react';
import { IFile } from "@/types/chat";
import { X, FileIcon, ImageIcon, FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileAttachmentsProps {
  files: IFile[];
  removeFile: (index: number) => void;
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({ files, removeFile }) => {
  if (files.length === 0) return null;
  
  // Function to determine file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileTextIcon className="h-4 w-4" />;
    } else {
      return <FileIcon className="h-4 w-4" />;
    }
  };
  
  // Function to check if a file is an image
  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };
  
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div 
          key={index} 
          className={cn(
            "group relative rounded-md overflow-hidden border border-border",
            isImageFile(file.name) ? "h-20 w-20" : "flex items-center p-2 pr-8"
          )}
        >
          {isImageFile(file.name) ? (
            <>
              <img 
                src={file.url} 
                alt={file.name} 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs truncate max-w-[90%]">{file.name}</span>
              </div>
            </>
          ) : (
            <>
              {getFileIcon(file.name)}
              <span className="text-xs ml-2 truncate max-w-[100px]">{file.name}</span>
            </>
          )}
          
          <button
            type="button"
            onClick={() => removeFile(index)}
            className={cn(
              "absolute flex items-center justify-center",
              isImageFile(file.name) 
                ? "top-1 right-1 h-5 w-5 rounded-full bg-black/60 opacity-70 group-hover:opacity-100" 
                : "top-1/2 right-1 -translate-y-1/2 h-4 w-4"
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
