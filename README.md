## 🚀 Web Summarizer Chrome Extension

A modern Chrome Extension built with **Vite + React + CRXJS** to demonstrate the internal architecture of browser extensions and inter-component communication.

### 🏗️ Architecture & Process Isolation

Browser extensions operate in isolated environments. This project showcases how these "islands" interact:

1. **Popup (UI Layer)**

- **Environment:** Separate process (janam leta hai only on click).
- **Role:** User interface for interaction.
- **Constraint:** Cannot access the webpage DOM directly; relies on message passing.

2. **Content Script (The Bridge)**

- **Environment:** Injected directly into the Web Page DOM.
- **Role:** Reads, scrapes, or modifies the current page content.
- **Context:** Runs in the context of the website you are visiting.

3. **Background Service Worker (The Orchestrator)**

- **Environment:** Independent background process.
- **Role:** Handles long-running tasks, storage, and API calls (e.g., Summarization AI).
- **Nature:** Event-based; stays idle when not in use to save resources.

---

### 🛠️ Why CRXJS + Vite?

Standard extension development can be clunky. **CRXJS** simplifies this by:

- **HMR (Hot Module Replacement):** Popup aur Content scripts me changes karte hi browser auto-reload ho jata hai.
- **Vite Integration:** Modern tooling (ES Modules, TypeScript, Fast Bundling) use karne deta hai.
- **Unified Manifest:** `manifest.json` ko source code ka hissa bana deta hai, jisse assets handle karna easy hota hai.

### 📂 Build & Deployment

1. **Development:** `npm run dev` starts the Vite server with HMR.
2. **Production:** `npm run build` bundles everything into the `dist/` folder.
3. **Loading:** Open `chrome://extensions`, enable **Developer Mode**, and click **"Load unpacked"** pointing to the `dist/` directory.

---

### 📡 Communication Flow (How it works)

- **Popup** ➔ sends message to ➔ **Content Script** (to get page text).
- **Content Script** ➔ responds with ➔ **Scraped Text**.
- **Popup** ➔ sends text to ➔ **Background Script** (for API processing).

---

**Next Step:** Kya aapne isme koi AI API (like Gemini or OpenAI) integrate kiya hai? Agar haan, toh main "Features" section mein **Security/API Key handling** ka point bhi add kar sakta hoon.
