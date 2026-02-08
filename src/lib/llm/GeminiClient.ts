import type { LLMClient } from "./LLMClient";
import { GoogleGenAI } from "@google/genai";

export class GeminiClient implements LLMClient {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async main(prompt: string) {
    if (prompt.length === 0) {
      console.error("Prompt is empty");
      return "Error: Prompt cannot be empty";
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    console.log(`GeminiClient: Sending prompt to Gemini API with model ${this.model}`);
    
    const response = await ai.models.generateContent({
      model: this.model || "gemini-1.5-flash-001",
      contents: prompt,
    });

    return response.text || "No response from Gemini model";
  }

  async chat(prompt: string): Promise<string> {
    try {
      console.log(`Calling Gemini with Model: ${this.model}`);
      const response = await this.main(prompt);
      console.log("Gemini response:", response);
      return response;
    } catch (error: any) {
      console.error("Error in GeminiClient chat:", error);
      return `Error: ${error.message || "Failed to get response"}`;
    }
  }
}
