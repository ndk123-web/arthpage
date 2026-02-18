export class TimeoutError {
  static async ollamaRequestTimeout(): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Ollama Request timed out (30s)"));
      }, 30000);
    });
  }

  static async geminiRequestTimeout(): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Gemini Request timed out (30s)"));
      }, 30000);
    });
  }

  static async openaiRequestTimeout(): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("OpenAI Request timed out (30s)"));
      }, 30000);
    });
  }

  static async deepseekRequestTimeout(): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("DeepSeek Request timed out (30s)"));
      }, 30000);
    });
  }
}
