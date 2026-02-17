import type { LLMClient } from "./wrapper";

export class ClaudeClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async main(): Promise<string> {
    try {
      const url = `https://api.anthropic.com/v1/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Claude API Error:", errorText);
        return `Error: Claude API request failed with status ${response.status}`;
      }

      const data = await response.json();
      const text =
        data.content[0].text || data.choices[0].message.content || "";
      if (!text.trim()) {
        console.warn("Claude API returned empty response");
        return "Error: Claude API returned empty response";
      }

      return text;
    } catch (error: any) {
      console.error("Claude API Error:", error);
      return `Error: Claude API request failed. ${error.message}`;
    }
  }

  async chat(): Promise<string> {
    try {
      const response = await this.main();
      console.log("Claude response:", response);
      return response;
    } catch (error: any) {
      console.error("Error in ClaudeClient chat:", error);
      return `Error: ${error.message || "Failed to get response"}`;
    }
  }
}
