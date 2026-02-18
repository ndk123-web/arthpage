# Integration

ArthaPage supports a modular provider system, enabling seamless integration with both cloud-based and local Large Language Models (LLMs).

## Supported Providers

-   **OpenAI**: Integration via official SDK. Supports `gpt-4o`, `gpt-4-turbo`.
-   **Google Gemini**: Multimodal capabilities via `gemini-1.5-pro` and `gemini-1.5-flash`.
-   **Anthropic Claude**: High-context models including `claude-3-5-sonnet` and `claude-3-opus`.
-   **DeepSeek**: Optimized for coding and competitive performance.
-   **Ollama**: Local inference support for models like `llama3`, `mistral`, and `gemma`.

## Adding a New Provider

The codebase is designed to be extensible. Follow these steps to integrate a new LLM provider.

### 1. Implement Client Logic

Create a new client handler in `src/lib/llm/` (e.g., `mistral.ts`) that manages the API request lifecycle.

```typescript
// src/lib/llm/mistral.ts
export const runMistral = async (prompt: string, apiKey: string) => {
  // Implement API call logic here
  // Return consistent response format
};
```

### 2. Register Provider

Update the central wrapper in `src/lib/llm/wrapper.ts` to include the new provider mapping. This ensures the background script can route requests correctly.

### 3. Update UI Components

Modify the provider selection dropdown in `src/components/Sidebar.tsx` to expose the new option to the user.

```tsx
// src/components/Sidebar.tsx
<SelectItem value="mistral">Mistral AI</SelectItem>
```

### 4. Background Handling (Optional)

If the provider requires specific header management or proxying not covered by the default handler, add a dedicated listener in `src/background/utils/`.

## Security

-   **API Keys**: Keys are stored exclusively in the user's local browser storage (`chrome.storage.local`).
-   **Data Transmission**: Requests are sent directly from the browser to the API provider. No intermediate servers are involved.
-   **Local Mode**: When using Ollama, all data remains on the local device.

