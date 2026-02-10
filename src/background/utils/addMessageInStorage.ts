import { STORAGE_KEY } from "./chatStore";

export function addMessageInStorage(
  prompt: string,
  response: string,
  chatListId: string,
) {
  // This function will add a new message to the most recent chat in storage
  chrome.storage.local.get([STORAGE_KEY], (data) => {
    const chats: any = data[STORAGE_KEY] || [];
    console.log("Current chats in storage:", chats, typeof chats);

    // addMessage in the chatListId chat
    const updatedChats = chats.map((chat: any) => {
      if (chat.id === chatListId) {
        const newMessages = [
          ...chat.messages,
          {
            id: `msg-${Date.now()}`,
            role: "user",
            content: prompt,
            timestamp: Date.now(),
          },
          {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: response,
            timestamp: Date.now() + 1,
          },
        ];
        return {
          ...chat,
          messages: newMessages,
        };
      }
      return chat;
    });

    console.log("Updated chats to be saved:", updatedChats);
  });
}
