import { createRoot } from "react-dom/client";
import Sidebar from "../components/Sidebar";

// ?inline we are saying to vite that we want to import the CSS file as a string instead of a URL, so we can inject it into the shadow DOM
import styles from "../App.css?inline";

export function mountSidebar() {
  // Check if sidebar is already mounted
  const existingRoot = document.getElementById("my-extension-sidebar-root");
  if (existingRoot) {
    console.log("Sidebar already mounted");
    return;
  }

  // Create container without any CSS imports
  const container = document.createElement("div");
  container.id = "my-extension-sidebar-root";
  
  // Reset all styles to prevent page CSS from affecting sidebar
  Object.assign(container.style, {
    all: "initial",
    display: "block",
    margin: 0,
    padding: 0,
    border: "none",
    font: "inherit",
    zIndex: "9999",
    position: "fixed",
    top: "0",
    right: "0",
    height: "100vh",
    width: "auto",
  });

  document.body.appendChild(container);

  // isolate the sidebar from page styles by using Shadow DOM
  const shadowRoot: ShadowRoot = container.attachShadow({ mode: "open" });

  // Inject styles into shadow DOM
  const styleSheet: HTMLStyleElement = document.createElement("style");
  styleSheet.textContent = styles;
  shadowRoot.appendChild(styleSheet);
  
  // Create a root element ensuring it takes full height and applies base styles
  const rootElement: HTMLDivElement = document.createElement("div");
  rootElement.style.height = "100%";
  rootElement.classList.add("bg-background", "text-foreground", "font-sans", "antialiased");
  // If dark mode is detected on the host page, we might want to apply .dark class here
  // But usually typically we want the extension to manage its own theme or respect system preference.
  // For now, let's leave theme management to the Sidebar component or user preference storage.
   
  shadowRoot.appendChild(rootElement);

  // Mount React app
  const root = createRoot(rootElement);
  root.render(<Sidebar />);

  console.log("Sidebar mounted successfully");
}

// Function to unmount/remove the sidebar
export function removeSidebar() {
  const existingRoot = document.getElementById("my-extension-sidebar-root");
  if (existingRoot) {
    existingRoot.remove();
    console.log("Sidebar removed successfully");
  }
}
