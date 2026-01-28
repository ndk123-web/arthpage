import { useState } from "react"

export default function Popup() {
  const [text, setText] = useState("")

  const getPageText = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    chrome.tabs.sendMessage(tab.id!, { type: "GET_PAGE_TEXT" }, (response) => {
      setText(response.text.slice(0, 500))
    })
    console.log("Button Clicked");
    console.log("Text extracted:", text);
  }

  return (
    <div style={{ padding: 10, width: 300 }}>
      <button onClick={getPageText}>Extract Page Text</button>
      <pre style={{ whiteSpace: "pre-wrap" }}>{text}</pre>
    </div>
  )
}
