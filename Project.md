# 🚀 ArthaPage Chrome Extension

## 🎯 Project Aim
To create a powerful, privacy-focused browser extension that helps users understand and interact with web content efficiently. The extension bridges the gap between static web pages and AI capabilities, allowing users to:
1. **Summarize** long articles instantly.
2. **Chat** with the current page content using AI.
3. **Choose** between Cloud AI (for convenience) and Local AI (for privacy).

---

## 🛠️ Tech Stack using
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite + CRXJS
- **Styling:** Tailwind CSS + Shadcn/ui
- **Icons:** Lucide React
- **Manifest:** V3 (Modern Chrome Extension Standard)
- **State Management:** React Hooks + Local Storage

---

## ✨ Key Features

### 1. 🧩 Smart Popup Interface
- **Quick Actions:** Extract text summary or toggle the specialized sidebar.
- **Theme Aware:** Automatically syncs with system preferences or user selection (Dark/Light).
- **Clean UI:** Built with Shadcn components for a professional look.

### 2. 🤖 Interactive AI Sidebar
The core feature of egg extension. A fully functional React application injected into any webpage.

*   **💬 AI Chat Interface:**
    *   Chat directly with the context of the webpage.
    *   Mock responses ready for API integration.
*   **🔌 Dual AI Providers:**
    *   **Online Mode:** Support for OpenAI (GPT-3.5/4o) and Google Gemini.
    *   **Offline Mode:** Integration with **Ollama** for running generic local models (Llama 3, Mistral) securely on your machine.
*   **🎨 Customizability:**
    *   **Resizable:** Drag the edge to adjust width (300px - 800px).
    *   **Positioning:** Dock the sidebar to the **Left** or **Right** of the screen.
    *   **Theming:** Independent Dark/Light mode toggle.

### 3. 🛡️ Privacy & Security
- **Local First:** Option to use Local LLMs (Ollama) ensures data never leaves the user's machine.
- **No Remote Dependencies:** All UI assets are bundled within the extension.

---

## 📂 Architecture

| Component | Responsibility |
|-----------|----------------|
| **Popup** | Entry point. Handles basic extraction and sidebar injection triggers. |
| **Content Script** | The "Bridge". Reads DOM content and injects the Sidebar React Root into the page. |
| **Sidebar** | Main interactive component. Handles chat logic, settings, and UI rendering inside the host page. |
| **Background** | (Service Worker) Handles heavy lifting, API calls, and persistent state management. |

---

## 🔮 Future Roadmap
- [ ] Real API integration for OpenAI/Gemini.
- [ ] Functional connection to local Ollama instance.
- [ ] "Chat with PDF" support.
- [ ] Save chat history across sessions.
