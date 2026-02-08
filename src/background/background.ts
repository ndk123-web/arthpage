// import { GeminiClient } from "@/lib/llm/GeminiClient";

import { GeminiClient } from "@/lib/llm/GeminiClient";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "BACKGROUND_SCRIPT_WAKE_UP") {
    console.log("Background script woke up!");
    sendResponse({ status: "Background script is awake!" });
  }

  if (msg.type === "chat_message") {
    const { currentProvider, mode, currentModel, prompt } = msg;
    const provider = currentProvider || "gemini"; // default to Gemini
    const model =
      currentModel ||
      (provider === "gemini" ? "gemini-1.5-flash" : "default-model"); // default models based on provider

    // Offline Mode Handling
    if (mode === "offline") {
      sendResponse({
        response: `Offline mode (Ollama) not connected to background yet. Model: ${model}`,
      });
      return true;
    }

    // Online Mode Handling
    if (provider === "gemini") {
      // Pass the Dynamic Model from Sidebar
      runGemini(prompt, model).then((response) => {
        sendResponse({ response });
      });
      return true;
    } else if (provider === "openai") {
      runOpenAI(prompt, model).then((response) => {
        sendResponse({ response });
      });
      return true;
    } else {
      sendResponse({
        response: `Provider ${provider} is not configured in background.`,
      });
    }
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
        console.log(`Initializing Gemini with Key: ${geminiApiKey.substring(0, 5)}... and Model: ${targetModel}`);
        
        const geminiClient = new GeminiClient(
          geminiApiKey.trim(),
          targetModel,
        );

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
