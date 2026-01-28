async function extractPageText() {
  console.log("Extracting Page Text...");
  console.log("Document body text:", document.body.innerText);
  return document.body.innerText;
}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "GET_PAGE_TEXT") {
    const text = extractPageText(); // Assume this function is defined elsewhere
    sendResponse({ text });

    // send response now change the dom and paste the summary in a page
    document.body.innerText =
      "This is the extracted text summary: " +
      document.body.innerText.slice(0, 100) +
      "...";

      console.log("Page text extracted and modified.");
  }
});
