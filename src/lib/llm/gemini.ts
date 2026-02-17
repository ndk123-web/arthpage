import type { LLMClient } from "./wrapper";

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

    // we are going to use fetch instead of the official client library to avoid bundling issues in the extension
    try {
      /**
       curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
            -H 'Content-Type: application/json' \
            -H 'X-goog-api-key: AIzaSyAOHZuf5sAJbB6FKnppoNcgPis6pv2exSk' \
            -X POST \
            -d '{
              "contents": [
                {
                  "parts": [
                    {
                      "text": "Explain how AI works in a few words"
                    }
                  ]
                }
              ]
            }' 
      **/
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        return `Error: Gemini API request failed with status ${response.status}`;
      }

      const data = await response.json();
      console.log("Raw Gemini API response:", data);
      // Extract the generated content from the response
      const generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedContent) {
        console.error("Unexpected Gemini API response format:", data);
        return "Error: Unexpected response format from Gemini API";
      }
      return generatedContent;
    } catch (error: any) {
      console.error("Error in GeminiClient main method:", error);
      return `Error: ${error.message || "Failed to fetch response from Gemini API"}`;
    }
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

  // i will build this feature afterwards, for now we can just use the main chat method for both
  async historyChat(prompt: string): Promise<string> {
    // For Gemini, we can use the same chat method since it can handle context in the prompt
    return (
      "History chat is not implemented separately for Gemini. Using main chat method." +
      prompt
    );
  }
}
