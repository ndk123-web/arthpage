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
    console.log(
      `Received chat message with provider: ${provider}, model: ${model}, mode: ${mode}, prompt: ${prompt}`,
    );

    chrome.storage.sync.get([provider], (result) => {
      const providerValue = result[provider];
      console.log(
        `Provider value from storage for ${provider}:`,
        providerValue,
      );

      if (providerValue === "gemini") {
        runGemini(prompt).then((geminiResponse) => {
          console.log("Gemini response:", geminiResponse);
          sendResponse({ response: geminiResponse });
        });
      }
    });
  }

  // Keep the message channel open for async response
  return true;
});

async function runGemini(prompt: string) {
  try {
    chrome.storage.sync.get(["geminiApiKey", "geminiModel"], async (result) => {
      const { geminiApiKey, geminiModel } = result;

      if (!geminiApiKey || !geminiModel) {
        console.error("Gemini API key or model not set in storage");
        return;
      }

      const geminiClient = new GeminiClient(
        geminiApiKey as string,
        geminiModel as string,
      );

      const response = await geminiClient.chat(prompt);
      return !response ? "No response from Gemini client" : response;
    });
  } catch (error) {
    console.error("Error in runGemini:", error);
    return "Error: Failed to run Gemini client";
  }
}
