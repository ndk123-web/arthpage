import type { LLMClient } from "./wrapper";

export class OpenAiClient implements LLMClient {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async main(prompt: string): Promise<string> {
    if (prompt.length === 0) {
      console.error("Prompt is empty");
      return "Error: Prompt cannot be empty";
    }

    try {
      const url = `https://api.openai.com/v1/chat/completions`;

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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API Error:", errorText);
        return `Error: OpenAI API request failed with status ${response.status}`;
      }

      const data = await response.json();
      const text =
        data.candidates[0].content.parts[0].text ||
        data.choices[0].message.content ||
        "";

      if (!text.trim()) {
        console.warn("OpenAI API returned empty response");
        return "Error: OpenAI API returned empty response";
      }

      return text;
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      return `Error: OpenAI API request failed. ${error.message}`;
    }
  }

  async chat(prompt: string): Promise<string> {
    console.log(
      "Using model:",
      this.model,
      "with API key length:",
      this.apiKey.length,
    );
    // fetch response from OpenAI API
    return "This is a mock response from OpenAI API for prompt: " + prompt;
  }
}
