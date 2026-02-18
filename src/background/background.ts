// import { GeminiClient } from "@/lib/llm/GeminiClient";
import runGemini from "./utils/runGemini";
import runOpenAI from "./utils/runOpenai";
import runDeepSeek from "./utils/runDeepseek";
import { TimeoutError } from "./utils/error/timeout";

// import { GeminiClient } from "@/lib/llm/gemini";
import { OllamaClient } from "@/lib/llm/ollama";
import { addMessageInStorage } from "./utils/addMessageInStorage";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "BACKGROUND_SCRIPT_WAKE_UP") {
    console.log("Background script woke up!");
    sendResponse({ status: "Background script is awake!" });
  }

  if (msg.type === "chat_message") {
    // Destructure properties sent from Sidebar
    const {
      provider,
      mode,
      model,
      prompt,
      ollamaUrl,
      currentChatListId,
      actualUserPrompt,
    } = msg;

    // Fallback defaults
    const activeProvider = provider || "gemini";
    const activeModel =
      model ||
      (activeProvider === "gemini" ? "gemini-1.5-flash" : "default-model");

    // Offline Mode Handling
    if (mode === "offline") {
      // Use provided URL and Model, fallback to specific defaults if missing
      const url = ollamaUrl || "http://localhost:11434";
      const targetModel = model || "mistral";

      console.log(
        `[Offline] Initializing Ollama: URL=${url}, Model=${targetModel}`,
      );

      // what if it fails? We should handle that case as well
      const ollamaClient = new OllamaClient(url, targetModel, "normal");

      // // Create a timeout promise that rejects after 30 seconds
      // const timeoutPromise = new Promise<string>((_, reject) => {
      //   setTimeout(() => {
      //     reject(new Error("Request timed out (30s)"));
      //   }, 30000);
      // });

      /**
       * Race against the timeout promise to ensure we don't wait indefinitely for a response from Ollama. If Ollama responds within 30 seconds, we proceed to add the message to storage and send the response back to the Sidebar. If it fails or times out, we catch the error and send an appropriate error message back to the Sidebar.
       */
      Promise.race([
        ollamaClient.chat(prompt),
        TimeoutError.ollamaRequestTimeout(),
      ])
        .then((response) => {
          // before sending the response, let's add the message to storage
          if (currentChatListId) {
            addMessageInStorage(actualUserPrompt, response, currentChatListId);
            console.log(
              `Added message to storage for chat ID: ${currentChatListId}`,
            );
          }

          // Send the response back to the sender (Sidebar)
          sendResponse({ response });
        })
        .catch((error) => {
          console.error("Ollama request failed or timed out:", error);
          sendResponse({
            response:
              "Error: Server did not respond within 30 seconds or failed.",
          });
        });

      // Indicate that we will send a response asynchronously
      return true;
    }

    // For Gemini and OpenAI in online mode, we also want to implement a timeout mechanism to ensure that if the server does not respond within a reasonable time frame (e.g., 30 seconds), we handle it gracefully and inform the user through the Sidebar. This prevents the extension from hanging indefinitely while waiting for a response from the API.
    if (activeProvider === "gemini") {
      // Pass the Dynamic Model from Sidebar

      /**
       * In online mode with Gemini, we also implement a timeout mechanism similar to the offline case. We call the `runGemini` function with the prompt and the dynamically selected model, and
       */
      Promise.race([
        // Pass dynamic model to Gemini function
        runGemini(prompt, activeModel),

        // Create a timeout promise that rejects after 30 seconds to prevent hanging
        // new Promise((_, reject) =>
        //   setTimeout(() => reject(new Error("Request timed out (30s)")), 30000),
        // ),

        TimeoutError.geminiRequestTimeout(),
      ])
        .then((response) => {
          // before sending the response, let's add the message to storage

          /**
           * with currentChatListId we are also checking if the response is not an error message about missing API key,
           * because if the key is missing we don't want to add that as a message in the chat history.
           * We only want to add actual responses from Gemini to the chat history,
           * and if the API key is missing, that's more of a configuration error rather than a message that should be part of the conversation history.
           */
          if (
            currentChatListId &&
            response !==
              "Error: Gemini API Key is missing. Please set it in Options."
          ) {
            addMessageInStorage(
              actualUserPrompt,
              response as string,
              currentChatListId,
            );
            console.log(
              `Added message to storage for chat ID: ${currentChatListId}`,
            );
          }

          // here response can be either the Gemini response or a timeout error message, but we send it back to the Sidebar regardless
          sendResponse({ response });
        })
        .catch((error) => {
          console.error("Gemini request failed or timed out:", error);
          sendResponse({
            response:
              "Error: Server did not respond within 30 seconds or failed.",
          });
        });

      return true;
    }

    // For OpenAI, we implement the same timeout mechanism to ensure that if OpenAI does not respond within 30 seconds, we handle it gracefully and inform the user through the Sidebar.
    else if (activeProvider === "openai") {
      Promise.race([
        // Pass dynamic model to OpenAI function
        runOpenAI(prompt, activeModel),

        // Create a timeout promise that rejects after 30 seconds to prevent hanging
        TimeoutError.openaiRequestTimeout(),
      ])
        .then((response) => {
          if (
            currentChatListId &&
            response !== "Error: OpenAI API Key is missing."
          ) {
            addMessageInStorage(
              actualUserPrompt,
              response as string,
              currentChatListId,
            );
            console.log(
              `Added message to storage for chat ID: ${currentChatListId}`,
            );

            // Send the response back to the sender (Sidebar)
            sendResponse({ response });
          }
        })
        .catch((error) => {
          console.error("OpenAI request failed or timed out:", error);
          sendResponse({
            response:
              "Error: Server did not respond within 30 seconds or failed.",
          });
        });

      return true;
    } else if (activeProvider === "deepseek") {
      Promise.race([
        // Pass dynamic model to DeepSeek function
        runDeepSeek(prompt, activeModel),

        // Create a timeout promise that rejects after 30 seconds to prevent hanging
        TimeoutError.deepseekRequestTimeout(),
      ])
        .then((response) => {
          if (
            currentChatListId &&
            !response.startsWith("Error: DeepSeek API Key is missing")
          ) {
            addMessageInStorage(
              actualUserPrompt,
              response as string,
              currentChatListId,
            );
            console.log(
              `Added message to storage for chat ID: ${currentChatListId}`,
            );
            // Send the response back to the sender (Sidebar)
            sendResponse({ response });
          }
        })
        .catch((error) => {
          console.error("DeepSeek request failed or timed out:", error);
          sendResponse({
            response:
              `Error: Server did not respond within 30 seconds or failed. ${error.message || ""}`,
          });
        });
    } else {
      sendResponse({
        response: `Provider ${activeProvider} is not configured in background.`,
      });
    }
  }

  if (msg.type === "create_new_chat_list") {
    const { chatListId } = msg;

    if (!chatListId) {
      sendResponse({ status: "error", message: "chatListId is required" });
      return;
    }

    // Create a new chat list in storage with the provided ID (only one that is currently user is with interacting with the sidebar, so we can safely set it as current)
    chrome.storage.sync.set({ currentChatListId: chatListId }, () => {
      console.log(`Set currentChatListId in storage: ${chatListId}`);
      sendResponse({ status: "success" });
    });

    return true; // Indicate that we will send a response asynchronously
  }

  return true;
});
