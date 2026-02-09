import type { LLMClient } from "./LLMClient";

type OllamaResponse = {
  response: string;
  done: boolean;
};

export class OllamaClient implements LLMClient {
  constructor(
    private baseUrl: string,
    private model: string,
  ) {}

  async chat(prompt: string): Promise<string> {
    console.log(
      `Sending to Ollama at ${this.baseUrl} with model ${this.model}`,
    );
    // fetch http://localhost:11434

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log(`Ollama error response: ${errorText}`);
      return `Error: ${res.status} ${res.statusText} - ${errorText}`;
    }

    const data = (await res.json()) as OllamaResponse;

    console.log(`Ollama response: ${data.response}, done: ${data.done}`);

    return data.response;
  }
}
