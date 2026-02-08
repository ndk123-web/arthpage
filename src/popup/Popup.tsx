import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Zap, Sidebar, Moon, Sun } from "lucide-react"
import '../index.css'

export default function Popup() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarStatus, setSidebarStatus] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check system preference or saved preference
    const savedTheme = localStorage.getItem("extension-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(savedTheme ? savedTheme === "dark" : prefersDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem("extension-theme", newTheme ? "dark" : "light")
  }

  const getPageText = async () => {
    setLoading(true)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      chrome.tabs.sendMessage(tab.id!, { type : "GET_PAGE_TEXT"}, (response) => {
        console.log("Response from content script:", response)
        
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError)
          setText("Error: " + chrome.runtime.lastError.message)
          setLoading(false)
          return
        }
        
        if (response && response.text) {
          setText(response.text.slice(0, 500))
        } else {
          setText("No text found.")
        }
        setLoading(false)
      })
    } catch (error) {
      console.error("Error:", error)
      setText("Error extracting page text")
      setLoading(false)
    }
  }

  const injectSidebar = async () => {
    setSidebarStatus(true)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab.id) {
      try {
        chrome.tabs.sendMessage(tab.id, {type : "INJECT_SIDEBAR"}, (response) => {
          console.log("Sidebar injection response:", response)
          if (response && response.status === "SIDEBAR_INJECTED") {
            // setSidebarStatus("✓ Sidebar Active")
            // setTimeout(() => setSidebarStatus(""), 2000)
          }
          else {
            // setSidebarStatus("Failed to inject")
            // setTimeout(() => setSidebarStatus(""), 2000)
            confirm("Failed to inject sidebar: " + (response?.error || "Unknown error"))
          }
        })
      }
      catch(error) {
        console.error("Error injecting sidebar:", error)
        // setSidebarStatus("Error")
        // setTimeout(() => setSidebarStatus(""), 2000)
      }
    }
  }

  const toggleSidebar = async () => {
    setSidebarStatus(!sidebarStatus)
  }

  return (
    <div className={`w-96 flex flex-col h-auto rounded-lg shadow-2xl transition-colors border ${isDark ? 'bg-black text-gray-100 border-neutral-800' : 'bg-white text-gray-900 border-gray-200'}`}>
      {/* Header - Vercel style */}
      <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white'} rounded-t-lg`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Web Summarizer</h1>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>AI-powered extraction</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
        >
          {isDark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 space-y-4">
        {text ? (
          <div className="space-y-3">
            <div className={`rounded-lg p-3 border text-sm font-mono overflow-auto max-h-60 ${isDark ? 'bg-neutral-900 border-neutral-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <p className="whitespace-pre-wrap break-words">
                {text}
              </p>
            </div>
          </div>
        ) : (
          <div className={`text-center py-10 border-2 border-dashed rounded-lg ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No content extracted</p>
            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Extract text to view summary</p>
          </div>
        )}
      </div>

      {/* Button Area */}
      <div className={`p-5 pt-0 space-y-3`}>
        {/* Extract Text Button */}
        <Button
          onClick={getPageText}
          disabled={loading}
          className={`w-full h-10 font-medium transition-all ${
            isDark 
              ? 'bg-white text-black hover:bg-gray-200 border-transparent' 
              : 'bg-black text-white hover:bg-neutral-800 border-transparent'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Extract Page Text</span>
            </>
          )}
        </Button>

        {/* Sidebar Button */}
        <Button 
          onClick={() => {
            if (!sidebarStatus)
                injectSidebar()
            
            toggleSidebar()
          }}
          className={`w-full h-10 font-medium border ${
            isDark 
              ? 'bg-black text-white border-neutral-800 hover:bg-neutral-900' 
              : 'bg-white text-black border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Sidebar className="w-4 h-4 mr-2" />
          <span>{sidebarStatus ? "Close Sidebar" : "Open Sidebar"}</span>
        </Button>
      </div>
    </div>
  )
}
