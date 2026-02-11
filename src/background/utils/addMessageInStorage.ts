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
    let chatFound = false;
    const updatedChats: any[] = chats.map((chat: any) => {
      if (chat.id === chatListId) {
        chatFound = true;
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

    if (!chatFound) {
      // If the chatListId is not found, create a new chat with the message
      updatedChats.push({
        id: chatListId,
        name: `Chat ${chatListId}`,
        messages: [
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
        ],
      });

      // Also set this new chatListId as the currentChatListId in storage
      chrome.storage.sync.set({ currentChatListId: chatListId }, () => {
        console.log(`Set currentChatListId in storage: ${chatListId}`);
      });
    }

    console.log("Updated chats to be saved:", updatedChats);

    // Save the updated chats back to storage
    chrome.storage.local.set({ [STORAGE_KEY]: updatedChats }, () => {
      console.log("Messages saved to storage.");
    });
  });
}
