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

        // Update the chat with the new messages and update the createdAt timestamp to reflect recent activity
        return {
          ...chat,
          messages: newMessages, // replace old messages with new messages array
          createdAt: Date.now(), // replace old timestamp with current timestamp to reflect recent activity
        };
      }
      return chat;
    });

    // if not found, create a new chat with this message and set it as currentChatListId
    if (!chatFound) {
      updatedChats.push({
        id: chatListId,
        createdAt: Date.now(), // Add timestamp for new chat
        name: `Chat ${chatListId}`,
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: "user",
            content: prompt,
            createdAt: Date.now(),
          },
          {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: response,
            createdAt: Date.now() + 1,
          },
        ],
      });

      // Also set this new chatListId as the currentChatListId in storage
      chrome.storage.sync.set({ currentChatListId: chatListId });
    }

    console.log("Updated chats to be saved:", updatedChats);

    // Save the updated chats back to storage should be an array
    chrome.storage.local.set({ [STORAGE_KEY]: updatedChats }, () => {
      console.log("Messages saved to storage.");
    });
  });
}
