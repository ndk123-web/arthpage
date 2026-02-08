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
    const { provider, mode, model, prompt } = msg;
    
    // Offline Mode Handling
    if (mode === "offline") {
        sendResponse({ response: `Offline mode (Ollama) not connected to background yet. Model: ${model}` });
        return true;
    }

    // Online Mode Handling
    if (provider === "gemini") {
        // Pass the Dynamic Model from Sidebar
        runGemini(prompt, model).then((response) => {
            sendResponse({ response });
        });
        return true;
    } 
    
    else if (provider === "openai") {
        runOpenAI(prompt, model).then((response) => {
            sendResponse({ response });
        });
        return true;
    }

    else {
        sendResponse({ response: `Provider ${provider} is not configured in background.` });
    }
  }

  return true;
});

// --- Provider Implementations ---

async function runGemini(prompt: string, dynamicModel?: string): Promise<string> {
  return new Promise((resolve) => {
    // Only get API Key from storage. Use dynamicModel if provided.
    chrome.storage.sync.get(["geminiApiKey"], async (result) => {
      const { geminiApiKey } = result;

      if (!geminiApiKey) {
        resolve("Error: Gemini API Key is missing. Please set it in Options.");
        return;
      }

      try {
        // Use the model selected in Sidebar, or default to flash
        const targetModel = dynamicModel || "gemini-1.5-flash";
        
        const geminiClient = new GeminiClient(
          geminiApiKey as string,
          targetModel,
        );

        const response = await geminiClient.chat(prompt);
        resolve(response || "No response.");
      } catch (error: any) {
        resolve(`Error: Gemini Request Failed. ${error.message || ''}`);
      }
    });
  });
}

async function runOpenAI(prompt: string, dynamicModel?: string): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["openaiApiKey"], async (result) => {
            const { openaiApiKey } = result;
            if(!openaiApiKey) {
                resolve("Error: OpenAI API Key is missing.");
                return;
            }
            // Mock OpenAI Call for now (Client needs implementing)
            resolve(`[Mock OpenAI] Response using model: ${dynamicModel || 'default'} (Prompt: ${prompt.substring(0,20)}...)`);
        });
    })
}
