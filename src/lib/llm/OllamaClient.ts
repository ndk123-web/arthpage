import type { LLMClient } from "./LLMClient";
import { SYSTEM_PROMPT } from "../utils";

type OllamaResponse = {
  response: string;
  done: boolean;
};

export class OllamaClient implements LLMClient {
  constructor(
    private baseUrl: string,
    private model: string,
    private way: "smart" | "normal" = "normal", // default to normal way, can be overridden to smart way for streaming responses
  ) {}

  async smartWay(prompt: string): Promise<string> {
    // i will use /api/chat endpoint with stream=true and return the response as it comes
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
          // here we can also add user and assistant messages if we want to maintain a conversation history
        ],
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

  async normaWay(prompt: string): Promise<string> {
    // i will use /api/chat endpoint with stream=false and wait for the full response before returning

    const res = await fetch(`${this.baseUrl}/api/endpoint`, {
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

  async chat(prompt: string): Promise<string> {
    console.log(
      `Sending to Ollama at ${this.baseUrl} with model ${this.model}`,
    );
    // fetch http://localhost:11434

    let response: string = "";
    if (this.way === "normal") {
      response = await this.normaWay(prompt);
      console.log(`Final response from Ollama: ${response}`);
    } else if (this.way === "smart") {
      response = await this.smartWay(prompt);
      console.log(`Final response from Ollama: ${response}`);
    }

    return response;
  }
}
