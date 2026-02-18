import { DeepSeekClient } from "@/lib/llm/deepseek";

async function runDeepSeek(
  prompt: string,
  dynamicModel: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Only get API Key from storage. Use dynamicModel if provided. We assume DeepSeek doesn't require additional configuration for now, but this can be expanded in the future if needed. The target model is determined by the dynamicModel parameter passed from the Sidebar, allowing for flexibility in model selection without hardcoding it in the background script. This design keeps the background script adaptable to different models that DeepSeek might offer, while still ensuring that the necessary API key is securely retrieved from Chrome's storage.
    chrome.storage.sync.get(["deepseek"], async (result: any) => {
      const deepSeekConfig = result.deepseek || {};
      const deepseekApiKey = deepSeekConfig.apiKey;

      if (!deepseekApiKey) {
        reject("Error: DeepSeek API Key is missing. Please set it in Options.");
        return;
      }

      try {
        const targetModel = dynamicModel || "default-deepseek-model";
        const deepseek_client = new DeepSeekClient(
          deepseekApiKey.trim(),
          targetModel,
        );

        const response: string = await deepseek_client.chat(prompt);
        if (response.startsWith("Error:")) {
          reject(response);
          return;
        }

        resolve(response || "No response.");
      } catch (error: any) {
        console.log("Error initializing DeepSeek client:", error);
        reject(`Error: DeepSeek Request Failed. ${error.message || ""}`);
      }
    });
  });
}

export default runDeepSeek;
