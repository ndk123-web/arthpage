// import { GeminiClient } from "@/lib/llm/GeminiClient";

import { GeminiClient } from "@/lib/llm/GeminiClient";
import { OllamaClient } from "@/lib/llm/OllamaClient";
import { addMessageInStorage } from "./utils/addMessageInStorage";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "BACKGROUND_SCRIPT_WAKE_UP") {
    console.log("Background script woke up!");
    sendResponse({ status: "Background script is awake!" });
  }

  if (msg.type === "chat_message") {
    // Destructure properties sent from Sidebar
    const {
      provider,
      mode,
      model,
      prompt,
      ollamaUrl,
      currentChatListId,
      actualUserPrompt,
    } = msg;

    // Fallback defaults
    const activeProvider = provider || "gemini";
    const activeModel =
      model ||
      (activeProvider === "gemini" ? "gemini-1.5-flash" : "default-model");

    // Offline Mode Handling
    if (mode === "offline") {
      // Use provided URL and Model, fallback to specific defaults if missing
      const url = ollamaUrl || "http://localhost:11434";
      const targetModel = model || "mistral";

      console.log(
        `[Offline] Initializing Ollama: URL=${url}, Model=${targetModel}`,
      );

      // what if it fails? We should handle that case as well
      const ollamaClient = new OllamaClient(url, targetModel, "normal");

      // Create a timeout promise that rejects after 30 seconds
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timed out (30s)"));
        }, 30000);
      });

      Promise.race([ollamaClient.chat(prompt), timeoutPromise])
        .then((response) => {
          // before sending the response, let's add the message to storage
          if (currentChatListId) {
            addMessageInStorage(actualUserPrompt, response, currentChatListId);
            console.log(
              `Added message to storage for chat ID: ${currentChatListId}`,
            );
          }

          // Send the response back to the sender (Sidebar)
          sendResponse({ response });
        })
        .catch((error) => {
          console.error("Ollama request failed or timed out:", error);
          sendResponse({
            response:
              "Error: Server did not respond within 30 seconds or failed.",
          });
        });

      // Indicate that we will send a response asynchronously
      return true;
    }

    // Online Mode Handling
    if (activeProvider === "gemini") {
      // Pass the Dynamic Model from Sidebar
      runGemini(prompt, activeModel).then((response) => {
        sendResponse({ response });
      });
      return true;
    } else if (activeProvider === "openai") {
      runOpenAI(prompt, activeModel).then((response) => {
        sendResponse({ response });
      });
      return true;
    } else {
      sendResponse({
        response: `Provider ${activeProvider} is not configured in background.`,
      });
    }
  }

  if (msg.type === "create_new_chat_list") {
    const { chatListId } = msg;

    if (!chatListId) {
      sendResponse({ status: "error", message: "chatListId is required" });
      return;
    }

    // Create a new chat list in storage with the provided ID (only one that is currently user is with interacting with the sidebar, so we can safely set it as current)
    chrome.storage.sync.set({ currentChatListId: chatListId }, () => {
      console.log(`Set currentChatListId in storage: ${chatListId}`);
      sendResponse({ status: "success" });
    });

    return true; // Indicate that we will send a response asynchronously
  }

  return true;
});

// --- Provider Implementations ---

async function runGemini(
  prompt: string,
  dynamicModel?: string,
): Promise<string> {
  return new Promise((resolve) => {
    // Only get API Key from storage. Use dynamicModel if provided.
    chrome.storage.sync.get(["gemini"], async (result: any) => {
      const geminiConfig = result.gemini || {};
      const geminiApiKey = geminiConfig.apiKey;

      if (!geminiApiKey) {
        resolve("Error: Gemini API Key is missing. Please set it in Options.");
        return;
      }

      try {
        // Use the model selected in Sidebar, or default to flash
        const targetModel = dynamicModel || "gemini-1.5-flash-001";
        console.log(
          `Initializing Gemini with Key: ${geminiApiKey.substring(0, 5)}... and Model: ${targetModel}`,
        );

        const geminiClient = new GeminiClient(geminiApiKey.trim(), targetModel);

        const response = await geminiClient.chat(prompt);
        resolve(response || "No response.");
      } catch (error: any) {
        resolve(`Error: Gemini Request Failed. ${error.message || ""}`);
      }
    });
  });
}

async function runOpenAI(
  prompt: string,
  dynamicModel?: string,
): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["openai"], async (result: any) => {
      const openaiConfig = result.openai || {};
      const openaiApiKey = openaiConfig.apiKey;

      if (!openaiApiKey) {
        resolve("Error: OpenAI API Key is missing.");
        return;
      }
      // Mock OpenAI Call for now (Client needs implementing)
      resolve(
        `[Mock OpenAI] Response using model: ${dynamicModel || "default"} (Prompt: ${prompt.substring(0, 20)}...)`,
      );
    });
  });
}
