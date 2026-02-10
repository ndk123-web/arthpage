export async function extractPageContentSafe() {
  // 1️⃣ main content ka best guess
  const root =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector('[role="main"]') ||
    document.body;

  const blocks: string[] = [];

  root.querySelectorAll("h1, h2, h3, p, li").forEach((el) => {
    // skip invisible elements
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;

    // skip elements inside unwanted parents
    if (
      el.closest("nav") ||
      el.closest("footer") ||
      el.closest("header") ||
      el.closest("aside")
    )
      return;

    const text = el.textContent.trim();

    if (text.length < 40) return;
    if (text.length > 600) return;

    blocks.push(text);
  });

  // limit size
  const MAX_CHARS = 5000;
  let content = "";

  for (const block of blocks) {
    if ((content + block).length > MAX_CHARS) break;
    content += block + "\n\n";
  }

  console.log("Extracted content:", content);

  return {
    title: document.title,
    url: location.href,
    domain: location.hostname,
    content,
  };
}
