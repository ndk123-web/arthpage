import { createRoot } from "react-dom/client";
import Sidebar from "../components/Sidebar";
import "../App.css"; // Import styles

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
  });

  document.body.appendChild(container);

  // Mount React app
  const root = createRoot(container);
  root.render(<Sidebar />);

  console.log("Sidebar mounted successfully");
}
