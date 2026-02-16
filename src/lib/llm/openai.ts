import type { LLMClient } from "./wrapper";

export class OpenAiClient implements LLMClient {
    
    constructor(private apiKey: string, private model: string) {}

    async chat(prompt: string): Promise<string> {
        console.log("Using model:", this.model, "with API key length:", this.apiKey.length);
        // fetch response from OpenAI API
        return "This is a mock response from OpenAI API for prompt: " + prompt;
    }
}