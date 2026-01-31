chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "BACKGROUND_SCRIPT_WAKE_UP") {
    console.log("Background script woke up!");
    sendResponse({ status: "Background script is awake!" });
  }

  // Keep the message channel open for async response
  return true;
});
