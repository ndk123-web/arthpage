export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  pageUrl?: string;
  domain?: string;
  messages: ChatMessage[];
};

export type StorageShape = {
  chats: Chat[];
};
