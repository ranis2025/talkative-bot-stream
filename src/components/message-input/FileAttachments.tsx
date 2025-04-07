
import { Button } from "@/components/ui/button";
import { Images, FileText, Mic, X } from "lucide-react";
import { IFile } from "@/types/chat";

interface FileAttachmentsProps {
  files: IFile[];
  onRemoveFile: (index: number) => void;
}

export function FileAttachments({ files, onRemoveFile }: FileAttachmentsProps) {
  return (
    <div className="p-2 border-b flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center bg-secondary/30 p-1 rounded text-xs gap-1"
        >
          {file.type.startsWith("image/") ? (
            <Images className="h-3 w-3" />
          ) : file.type.startsWith("audio/") ? (
            <Mic className="h-3 w-3" />
          ) : (
            <FileText className="h-3 w-3" />
          )}
          <span className="truncate max-w-[100px]">{file.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-full"
            onClick={() => onRemoveFile(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
