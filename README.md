## Web Summarizer Chrome Extension

This is a Chrome extension built using Vite + CRXJS to understand
how browser extensions work internally.

### Architecture

Chrome extensions run in isolated environments:

1. Popup (separate process)
   UI shown when clicking the extension icon.
   Cannot access the webpage DOM directly.

2. Content Script (Its in Web Page DOM)
   Injected into the current webpage.
   Used to read and clean page content.

3. Background Service Worker (Its separate process)
   Handles messaging, storage, and heavy logic
   (like API calls).

### Why CRXJS?

CRXJS integrates Chrome Extension workflows into Vite.
It bundles popup, content scripts, and background scripts
into production-ready JavaScript inside `dist/`.

Chrome loads only the `dist/` folder.
