
import { Button } from "@/components/ui/button";
import { Plus, Images, File, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileInputButtonProps {
  openFileInput: (accept: string) => void;
  disabled: boolean;
}

export function FileInputButton({ openFileInput, disabled }: FileInputButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          disabled={disabled}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openFileInput("image/*")}>
          <Images className="h-4 w-4 mr-2" />
          <span>Изображение</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openFileInput(".pdf,.doc,.docx,.txt")}>
          <File className="h-4 w-4 mr-2" />
          <span>Документ</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openFileInput("*")}>
          <Paperclip className="h-4 w-4 mr-2" />
          <span>Любой файл</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
