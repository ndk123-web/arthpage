import { OpenAiClient } from "@/lib/llm/openai";
// --- Provider Implementations ---

async function runOpenAI(
  prompt: string,
  dynamicModel?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["openai"], async (result: any) => {
      const openaiConfig = result.openai || {};
      const openaiApiKey = openaiConfig.apiKey;

      if (!openaiApiKey) {
        resolve("Error: OpenAI API Key is missing.");
        return;
      }

      try {
        const targetModel = dynamicModel || "gpt-3.5-turbo";
        console.log(
          `Initializing OpenAI with Key: ${openaiApiKey.substring(0, 5)}... and Model: ${targetModel}`,
        );

        const openAiClient = new OpenAiClient(openaiApiKey.trim(), targetModel);

        const response = await openAiClient.chat(prompt);
        return response;
      } catch (error: any) {
        reject(`Error: OpenAI Request Failed. ${error.message || ""}`);
      }
    });
  });
}

export default runOpenAI;
