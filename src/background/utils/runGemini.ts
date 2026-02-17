import { GeminiClient } from "@/lib/llm/gemini";

// --- Provider Implementations ---

async function runGemini(
  prompt: string,
  dynamicModel?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
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
        reject(`Error: Gemini Request Failed. ${error.message || ""}`);
      }
    });
  });
}

export default runGemini;
