// async function extractPageText() {
//   console.log("Extracting Page Text...");
//   console.log("Document body text:", document.body.innerText);
//   return document.body.innerText;
// }

// chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
//   if (msg.type === "GET_PAGE_TEXT") {
//     const text = extractPageText(); // Assume this function is defined elsewhere
//     sendResponse({ text });

//     // send response now change the dom and paste the summary in a page
//     document.body.innerText =
//       "This is the extracted text summary: " + document.body.innerText !== null
//         ? document.body.innerText.slice(0, 100) + "..."
//         : "No text found.";

//     console.log("Page text extracted and modified.");
//   }
// });

// Popup to content script communication
// Keep the message channel open for async response
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "GET_PAGE_TEXT") {
    console.log("Reached content script to get page text");

    // Content script to background script communication
    // Wake up background script
    chrome.runtime.sendMessage(
      { type: "BACKGROUND_SCRIPT_WAKE_UP" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error from background:", chrome.runtime.lastError);
        } else {
          console.log("Background script wake-up response:", response);
        }
      },
    );

    const text = document.body.innerText || "No text found.";
    console.log("Sending response:", { text });
    sendResponse({ text });

  }
  return true; // Keep the channel open for async response
});
