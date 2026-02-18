import { ClaudeClient } from "@/lib/llm/claude";

async function runClaude(apiKey: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["claude"], async (result: any) => {
      const claudeConfig = result.claude || {};
      const claudeApiKey = claudeConfig.apiKey || apiKey;
      const claudeModel = model || claudeConfig.model || "claude-2";

      if (!claudeApiKey) {
        reject("Error: Claude API Key is missing. Please set it in Options.");
        return;
      }

      try {
        const claude_client = new ClaudeClient(
          claudeApiKey.trim(),
          claudeModel,
        );
        const response: string = await claude_client.chat();
        if (response.startsWith("Error:")) {
          reject(response);
          return;
        }
        resolve(response || "No response.");
      } catch (error: any) {
        console.log("Error initializing Claude client:", error);
        reject(`Error: Claude Request Failed. ${error.message || ""}`);
      }
    });
  });
}

export default runClaude;
