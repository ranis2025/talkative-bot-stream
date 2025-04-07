
import React, { useState } from "react";
import { ImageIcon, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractImages } from "@/lib/fileExtractor";

interface ImageAttachmentsProps {
  content?: string;
}

export const ImageAttachments: React.FC<ImageAttachmentsProps> = ({ content }) => {
  const [imageLoaded, setImageLoaded] = useState<{[key: string]: boolean}>({});
  const extractedImageLinks = content ? extractImages(content) : [];
  
  if (extractedImageLinks.length === 0) return null;
  
  // Handle image load
  const handleImageLoad = (imageUrl: string) => {
    setImageLoaded(prev => ({...prev, [imageUrl]: true}));
  };
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1 mb-2">
        <Images className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Изображения из ответа:</span>
      </div>
      
      {extractedImageLinks.map((imageUrl, index) => (
        <div key={index} className="relative">
          {!imageLoaded[imageUrl] && (
            <div className="bg-muted/30 animate-pulse h-40 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          <img 
            src={imageUrl} 
            alt={`Изображение ${index + 1}`} 
            className={cn(
              "w-full rounded-md max-h-80 object-contain bg-black/5", 
              !imageLoaded[imageUrl] && "hidden"
            )}
            onLoad={() => handleImageLoad(imageUrl)}
          />
        </div>
      ))}
    </div>
  );
};
