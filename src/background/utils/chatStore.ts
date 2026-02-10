import type { Chat } from "@/shared/types/chat";

export const MAX_CHATS = 50;
export const MAX_MESSAGES_PER_CHAT = 300;

export const STORAGE_KEY = "arthpage_chats";

// 1️⃣ Get all chats
export function getChats(): Promise<Chat[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      resolve((data[STORAGE_KEY] || []) as Chat[]);
    });
  });
}

// 2️⃣ Save all chats
export function saveChats(chats: Chat[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: chats }, resolve);
  });
}
