import { useState } from "react"

export default function Popup() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const getPageText = async () => {
    setLoading(true)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    chrome.tabs.sendMessage(tab.id!, { type: "GET_PAGE_TEXT" }, (response) => {
      setText(!response ? response.text.slice(0, 500) : "No text found.")
      setLoading(false)
    })
  }

  return (
    <div className="w-80 bg-slate-950 text-slate-100 flex flex-col h-96">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 font-semibold text-white">
        Web Summarizer
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
        {text ? (
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-200 whitespace-pre-wrap break-words">
            {text}
          </div>
        ) : (
          <div className="text-center text-slate-400 text-sm">
            {loading ? "Extracting text..." : "Click the button to extract page text"}
          </div>
        )}
      </div>

      {/* Button Area */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={getPageText}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Extracting..." : "Extract Page Text"}
        </button>
      </div>
    </div>
  )
}
