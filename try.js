import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAOHZuf5sAJbB6FKnppoNcgPis6pv2exSk",
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

// main();

async function testMarkdown() {
  const llmresponse = `
# AI Explained

AI learns from data.

\`\`\`js
console.log("Hello")
\`\`\`
`;

  const html = marked.parse(llmresponse);

  console.log(html);
}

testMarkdown();
