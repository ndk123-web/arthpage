import type { LLMClient } from "./wrapper";

export class DeepSeekClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async main(prompt: string): Promise<string> {
    try {
      const url = `https://api.deepseek.com/v1/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepSeek API Error:", errorText);
        return `Error: DeepSeek API request failed with status ${response.status}`;
      }

      const data = await response.json();
      const text = data.choices[0].message.content || "";
      if (!text.trim()) {
        console.warn("DeepSeek API returned empty response");
        return "Error: DeepSeek API returned empty response";
      }

      return text;
    } catch (error: any) {
      console.error("DeepSeek API Error:", error);
      return `Error: DeepSeek API request failed. ${error.message}`;
    }
  }

  async chat(prompt: string): Promise<string> {
    try {
      const response = await this.main(prompt);
      console.log("DeepSeek response:", response);
      return response;
    } catch (error: any) {
      console.error("Error in DeepSeekClient chat:", error);
      return `Error: ${error.message || "Failed to get response"}`;
    }
  }
}
