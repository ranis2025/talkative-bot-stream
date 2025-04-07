
interface FileLink {
  text: string;
  url: string;
}

// Extract image links from text content
export const extractImages = (content?: string): string[] => {
  if (!content) return [];
  
  const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))(\s|$|\)|\]|"|')/gi;
  const matches = [...content.matchAll(imgRegex)];
  
  return matches.map(match => match[1]);
};

// Extract file links from text content
export const extractFiles = (content?: string): FileLink[] => {
  if (!content) return [];
  
  const fileRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+\.(?!png|jpg|jpeg|gif|webp)[a-zA-Z0-9]+)\)/gi;
  const fileMatches = [...content.matchAll(fileRegex)];
  
  return fileMatches.map(match => ({
    text: match[1],
    url: match[2]
  }));
};

// Extract audio links from text content
export const extractAudio = (content?: string): string[] => {
  if (!content) return [];
  
  const audioRegex = /(https?:\/\/.*\.(?:mp3))(\s|$|\)|\]|"|')/gi;
  const audioMatches = [...content.matchAll(audioRegex)];
  
  return audioMatches.map(match => match[1]);
};
