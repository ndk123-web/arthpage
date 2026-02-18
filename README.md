
<div align="center">
  <img src="public/icons/arthpage-opt.png" alt="ArthPage Logo" width="100" height="100" style="border-radius: 50%;">
</div>
<p align="center">
 <h1 align="center">ArthPage</h1>
</p>

**ArthPage** integrates a contextual AI sidebar heavily optimized for research and reading. It allows users to interact with webpage content using various Large Language Models (LLMs) including OpenAI, Gemini, Claude, DeepSeek, and local Ollama instances.

## Features

- **Context-Aware Chat**: Ask questions directly related to the current webpage.
- **Model Flexibility**: Switch between cloud providers (OpenAI, Gemini, Anthropic) and local privacy-focused models (Ollama).
- **Isolated UI**: Built with Shadow DOM to ensure styles do not bleed into or from the host webpage.
- **Persistent Settings**: Syncs preferences and API configurations across browser sessions.
- **Privacy-First**: API keys are stored in local storage and never transmitted to intermediate servers.

## Installation

### For Users

1.  Download the latest release from the **Releases** section.
2.  Extract the archive to a local folder.
3.  Open your browser (Chrome/Brave/Edge) and navigate to `chrome://extensions`.
4.  Enable **Developer Mode** in the top right.
5.  Click **Load unpacked** and select the `dist` folder from the extracted archive.

### For Developers

1.  Clone the repository:
    ```bash
    git clone https://github.com/Start-Up-code/First-Web-Extension.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server with Hot Module Replacement (HMR):
    ```bash
    npm run dev
    ```
4.  Load the `dist` folder in `chrome://extensions` as an unpacked extension.

## Documentation

Detailed documentation is available in the `docs` directory:

- [**Developer Guide**](docs/developer-guide.md): Setup, build processes, and Ollama configuration.
- [**Architecture**](docs/architecture.md): System design, message passing, and component isolation.
- [**Providers**](docs/providers.md): supported LLMs and integration details.
- [**Contributing**](docs/contributing.md): Guidelines for code contributions.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite + CRXJS
- **Styling**: Tailwind CSS (Shadow DOM compatible)
- **State Management**: React Hooks + Chrome Storage API

## Project Structure

```text
First-Web-Extension/
├── public/           # Static assets
├── src/
│   ├── background/   # Service workers (API handling)
│   ├── components/   # React UI components
│   ├── content/      # Injected scripts (Shadow DOM host)
│   ├── lib/          # Utilities and LLM clients
│   ├── options/      # Options page
│   ├── popup/        # Extension popup
│   └── manifest.json # Manifest V3 configuration
└── vite.config.ts    # Build configuration
```

## License

MIT
