
// interface for LLM clients
// use this interface to implement different LLM clients (e.g. OpenAI, Hugging Face, etc.)
export interface LLMClient {
  chat(prompt: string): Promise<string>;
}
