
import { useState, useEffect } from "react";

export function useFileExtractor(isBot: boolean, content?: string) {
  const [extractedImageLinks, setExtractedImageLinks] = useState<string[]>([]);
  const [extractedFileLinks, setExtractedFileLinks] = useState<{url: string, text: string}[]>([]);
  const [extractedAudioLinks, setExtractedAudioLinks] = useState<string[]>([]);

  useEffect(() => {
    if (isBot && content) {
      // Regular expression to find image URLs in text
      const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))(\s|$|\)|\]|"|')/gi;
      const matches = [...content.matchAll(imgRegex)];
      
      if (matches.length > 0) {
        const links = matches.map(match => match[1]);
        setExtractedImageLinks(links);
      } else {
        setExtractedImageLinks([]);
      }
      
      // Regular expression to find file URLs in text (excluding image formats)
      // This regex looks for markdown style links [text](url) where url is not an image
      const fileRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+\.(?!png|jpg|jpeg|gif|webp)[a-zA-Z0-9]+)\)/gi;
      const fileMatches = [...content.matchAll(fileRegex)];
      
      if (fileMatches.length > 0) {
        const fileLinks = fileMatches.map(match => ({
          text: match[1],
          url: match[2]
        }));
        setExtractedFileLinks(fileLinks);
      } else {
        setExtractedFileLinks([]);
      }
      
      // Regular expression to find mp3 URLs in text
      const audioRegex = /(https?:\/\/.*\.(?:mp3))(\s|$|\)|\]|"|')/gi;
      const audioMatches = [...content.matchAll(audioRegex)];
      
      if (audioMatches.length > 0) {
        const audioLinks = audioMatches.map(match => match[1]);
        setExtractedAudioLinks(audioLinks);
      } else {
        setExtractedAudioLinks([]);
      }
    } else {
      setExtractedImageLinks([]);
      setExtractedFileLinks([]);
      setExtractedAudioLinks([]);
    }
  }, [isBot, content]);

  return {
    extractedImageLinks,
    extractedFileLinks,
    extractedAudioLinks
  };
}
