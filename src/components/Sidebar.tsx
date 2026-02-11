// Part of ContentScript - Renders the Sidebar UI and handles all interactions

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import { X, Send, Bot, Moon, Sun, PanelLeft, PanelRight, Settings2 } from "lucide-react";
import { extractPageContentSafe } from "@/content/utils/extractContent";

// Types
type Message = {
  role: "user" | "assistant";
  content: string;
};

type Provider = "openai" | "gemini" | "claude" | "deepseek" | "ollama";
type SidebarSide = "left" | "right";
type Mode = "online" | "offline";

export default function Sidebar() {
  // Theme State
  const [isDark, setIsDark] = useState(false);
  
  // Sidebar State
  const [side, setSide] = useState<SidebarSide>("right");
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! How can I help you with this page today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings State
  const [mode, setMode] = useState<Mode>("online");
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState("gpt-4o");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [currentChatListId, setCurrentChatListId] = useState<string | null>(null); // For future chat list management

  // Effect for Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("extension-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(savedTheme ? savedTheme === "dark" : prefersDark);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "extension-theme") {
        setIsDark(e.newValue === "dark");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync settings from storage on mount
  useEffect(() => {
    chrome.storage.sync.get(['currentProvider', 'currentModel', 'provider', 'openai', 'gemini', 'claude', 'deepseek', 'ollama', 'mode'], (result: any) => {
        // Prioritize "currentProvider" if it exists (from Sidebar last session), otherwise fall back to "provider" (from Options)
        if (result.currentProvider) {
            setProvider(result.currentProvider as Provider);
        } else if (result.provider) {
            setProvider(result.provider as Provider);
        }

        if (result.currentModel) {
            setModel(result.currentModel as string);
        }
        
        // Load Ollama URL from settings if available
        if (result.ollama && result.ollama.url) {
            setOllamaUrl(result.ollama.url);
        }
        if (result.mode) {
            setMode(result.mode as Mode);
        } 
    });
  }, []);

  // Sync "current" selection to storage whenever it changes
  useEffect(() => {
    chrome.storage.sync.set({ currentProvider: provider, currentModel: model, mode: mode }, () => {
      console.log(`Saved current settings to storage: Provider=${provider}, Model=${model}, Mode=${mode}`);
    });
  }, [provider, model, mode]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      let newWidth;
      if (side === "right") {
        newWidth = window.innerWidth - e.clientX;
      } else {
        newWidth = e.clientX;
      }

      // Constraints
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 800) newWidth = 800;
      
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Re-enable text selection
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none"; // Prevent text selection while dragging
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, side]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("extension-theme", newTheme ? "dark" : "light");
  };

  const closeSidebar = () => {
    const root = document.getElementById("my-extension-sidebar-root");
    if (root) root.remove();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Capture input immediately
    const userQuestion = input;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userQuestion }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // DEBUG: Log ALL storage data before sending
    chrome.storage.sync.get(null, (items) => {
       console.log("🛑 DEBUG: Full Storage Dump:", items);
       console.log("👉 Sending Message with:", { provider, mode, model, prompt: userQuestion, ollamaUrl });
       setMode(mode)
    });

    let prompt = userQuestion;

    try {
        // Await the content extraction properly
        const contentData = await extractPageContentSafe();

        prompt = `
        You are ArthPage, an AI assistant embedded in a webpage.
        Your job is to help the user understand and interact with the webpage content.
        Built by Navnath Kadam who is the one who built the extension and knows its capabilities best. You can answer questions, summarize content, and provide insights based on the page data.

        Rules:
        - Prefer answering using the provided webpage content.
        - If the answer is not fully in the content, use general knowledge but stay relevant.
        - If the question is completely unrelated to the page, say so politely.
        - Be clear, concise, and helpful.

          User Prompt: ${userQuestion}

          Page Title: ${contentData.title}
          Page URL: ${contentData.url}
          Domain: ${contentData.domain}

          Page Content:
          ${contentData.content}
        `;
    } catch (error) {
        console.error("Failed to extract page content:", error);
        // Fallback: prompt remains as userQuestion
    }

    console.log("Final Prompt to be sent to background:", prompt);

    let activeChatId = currentChatListId;

    if (!activeChatId) {
      const newChatListId = `chat-${Date.now()}`;
      setCurrentChatListId(newChatListId);
      activeChatId = newChatListId;
      
      chrome.runtime.sendMessage({type: "create_new_chat_list", chatListId: newChatListId}, (response) => {
        if (response && response.status === "success") {
          console.log(`New chat list created in storage with ID: ${newChatListId}`);
        } else {
          console.error("Failed to create new chat list in storage:", response);
        }
      })

      console.log("No currentChatListId found, created new one:", newChatListId);
    }

    chrome.runtime.sendMessage({
      type: "chat_message", 
      provider, 
      model, 
      mode, 
      prompt: prompt, 
      ollamaUrl,
      actualUserPrompt: userQuestion, // Send the original user question for better context in background processing and storage
      currentChatListId: activeChatId
    }, ({response}) => {
      console.log("Received response from background script:", response);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response || "No response received." }
      ]);
      setLoading(false);
    })
    // Mock response block removed to allow real API response
  };

  const handleCreateNewChat = () => {
    // create a random ID for the chat list item
    const newChatListId = `chat-${Date.now()}`;
    setCurrentChatListId(newChatListId);

    chrome.runtime.sendMessage({type: "create_new_chat_list", chatListId: newChatListId}, (response) => {      if (response && response.status === "success") {
        console.log(`New chat list created in storage with ID: ${newChatListId}`);
      } else {
        console.error("Failed to create new chat list in storage:", response);
      } 
    });
    
    console.log("Creating new chat with ID:", newChatListId);
  }

  return (
    <div 
      style={{ width: `${width}px` }}
      className={cn(
        "fixed top-0 h-screen shadow-2xl z-[2147483647] font-sans antialiased transition-colors duration-300 flex flex-col",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        isDark ? "dark bg-black text-gray-100 border-neutral-800" : "light bg-white text-gray-900 border-gray-200"
      )}
    >
      {/* Resizer Handle */}
      <div 
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-[2147483650]",
          side === "right" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
        )}
        onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
        }}
      />

      {/* Header */}
      <div className={cn("flex items-center justify-between p-4 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60", isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white')}>
        <div className="flex items-center gap-2 font-semibold">
           <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shadow-sm", isDark ? 'bg-white text-black' : 'bg-black text-white')}>
             <Bot className="h-5 w-5" />
           </div>
           
           <div className="flex flex-col">
              <span className="text-sm leading-none">Web Assistant</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5 opacity-70">
                Drag edge to resize
              </span>
           </div>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={cn("h-8 w-8 rounded-full", showSettings && "bg-accent")}>
                <Settings2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>


      <button className="m-4 px-3 py-1 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreateNewChat}>
        New Chat 
      </button>

      {/* Extra Settings Panel (Collapsible) */}
      {showSettings && (
        <div className={cn("px-4 py-3 border-b space-y-3 animate-in slide-in-from-top-2", isDark ? "bg-neutral-900/30 border-neutral-800" : "bg-gray-50 border-gray-200")}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">Theme</span>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="h-7 text-xs gap-2 w-24">
                    {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                    {isDark ? "Light" : "Dark"}
                </Button>
            </div>
            
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">Position</span>
                <div className="flex items-center border rounded-md overflow-hidden h-7">
                    <button 
                        onClick={() => setSide("left")}
                        className={cn("px-3 h-full flex items-center justify-center transition-colors hover:bg-accent", side === "left" && "bg-primary text-primary-foreground")}
                    >
                        <PanelLeft className="h-3 w-3" />
                    </button>
                    <div className="w-[1px] bg-border h-full"></div>
                    <button 
                        onClick={() => setSide("right")}
                        className={cn("px-3 h-full flex items-center justify-center transition-colors hover:bg-accent", side === "right" && "bg-primary text-primary-foreground")}
                    >
                        <PanelRight className="h-3 w-3" />
                    </button>
                </div>
            </div>
            
            <div className="flex items-center justify-end">
                <span className="text-[10px] text-muted-foreground">
                    Current width: {width}px
                </span>
            </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm break-words whitespace-pre-wrap", 
                    msg.role === 'user' 
                        ? (isDark ? "bg-white text-black rounded-br-none" : "bg-black text-white rounded-br-none")
                        : (isDark ? "bg-neutral-900 text-gray-100 border border-neutral-800 rounded-bl-none" : "bg-gray-100 text-gray-900 rounded-bl-none"))}>
                    {msg.content}
                </div>
            </div>
        ))}
        {loading && (
             <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className={cn("rounded-2xl rounded-bl-none px-4 py-2 text-xs animate-pulse flex items-center gap-1", isDark ? "bg-neutral-900 text-gray-400" : "bg-gray-100 text-gray-500")}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-0"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-300"></span>
                </div>
             </div>
        )}
      </div>

      {/* Settings & Input Area */}
      <div className={cn("p-4 border-t space-y-3", isDark ? "bg-neutral-900/10 border-neutral-800" : "bg-gray-50/50 border-gray-200")}>
        
        {/* Model Selector Bar */}
        <div className="grid grid-cols-2 gap-2">
            {/* Mode Selector */}
            <Select value={mode} onValueChange={(val) => setMode(val as Mode)}>
              <SelectTrigger className={cn("h-8 text-xs font-semibold", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300" : "bg-white border-gray-200")}>
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className={cn("z-[2147483648] border", isDark ? "dark border-neutral-800 bg-neutral-950 text-white" : "light border-gray-200 bg-white text-gray-950")}>
                <SelectItem value="online">Online (API)</SelectItem>
                <SelectItem value="offline">Offline (Local)</SelectItem>
              </SelectContent>
            </Select>

            {/* Provider Selector (Only visible if Online) */}
            {mode === 'online' ? (
                 <Select value={provider} onValueChange={(val) => setProvider(val as Provider)}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300" : "bg-white border-gray-200")}>
                        <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent className={cn("z-[2147483648] border", isDark ? "dark border-neutral-800 bg-neutral-950 text-white" : "light border-gray-200 bg-white text-gray-950")}>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Gemini</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <div className={cn("h-8 flex items-center px-3 text-xs border rounded-md opacity-50 cursor-not-allowed", isDark ? "border-neutral-800 bg-neutral-900 text-gray-500" : "border-gray-200 bg-gray-50 text-gray-500")}>
                    Local (Ollama)
                </div>
            )}
        </div>

        {/* Model Selector (Dependent on Provider/Mode) */}
        {!showSettings && ( // Hide if expanded settings are open to save space, or just always show? Let's always show but keep it compact.
             <Select value={model} onValueChange={setModel}>
              <SelectTrigger className={cn("h-8 text-xs w-full", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300" : "bg-white border-gray-200")}>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className={cn("z-[2147483648] border", isDark ? "dark border-neutral-800 bg-neutral-950 text-white" : "light border-gray-200 bg-white text-gray-950")}>
                  {mode === 'online' ? (
                      <>
                        {provider === 'openai' && (
                            <>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </>
                        )}
                        {provider === 'gemini' && (
                            <>
                                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                                <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                                <SelectItem value="gemini-3-flash-preview">gemini-3-flash-preview</SelectItem>
                                <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                                <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                            </>
                        )}
                        {provider === 'claude' && (
                             <>
                                <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                                <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                             </>
                        )}
                        {provider === 'deepseek' && (
                             <>
                                <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                                <SelectItem value="deepseek-coder">DeepSeek Coder</SelectItem>
                             </>
                        )}
                      </>
                  ) : (
                      <>
                          <SelectItem value="llama3">Llama 3</SelectItem>
                          <SelectItem value="mistral">Mistral</SelectItem>
                          <SelectItem value="gemma">Gemma</SelectItem>
                          <SelectItem value="codellama">CodeLlama</SelectItem>
                      </>
                  )}
              </SelectContent>
            </Select>
        )}

         {mode === 'offline' && (
             <Input 
                placeholder="Ollama URL (http://localhost:11434)" 
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className={cn("h-8 text-xs", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300 placeholder:text-neutral-600" : "bg-white border-gray-200")}
             />
        )}

        {/* Chat Input */}
        <div className="relative">
            <Textarea 
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    // Reset height to auto to shrink if text is deleted, then grow to scrollHeight
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'; // Cap max height at 200px
                }}
                placeholder="Type a message..."
                rows={1}
                className={cn("min-h-[60px] max-h-[200px] pr-12 resize-none focus-visible:ring-1 shadow-sm py-3", isDark ? "bg-neutral-900 border-neutral-800 text-gray-100 placeholder:text-neutral-500 focus-visible:ring-neutral-700" : "bg-white border-gray-200 text-gray-900")}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                        // Reset height after sending (need to target element carefully, simple setInput handles value, but height needs reset)
                        // Ideally we use a Ref, but simple hack for now:
                        const target = e.target as HTMLTextAreaElement;
                        setTimeout(() => {
                           target.style.height = 'auto'; 
                        }, 0);
                    }
                }}
            />
            <Button 
                size="icon" 
                className={cn("absolute bottom-2 right-2 h-8 w-8 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95", isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-neutral-800")}
                onClick={handleSend}
                disabled={!input.trim() || loading}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-medium">
            <span className={cn("flex items-center gap-1 opacity-70", isDark ? "text-neutral-400" : "text-gray-500")}>
                {mode === 'online' ? '🟢 Cloud Connected' : '🟠 Local Server'}
            </span>
            <span className={cn("opacity-70", isDark ? "text-neutral-400" : "text-gray-500")}>{model}</span>
        </div>
      </div>
    </div>
  );
}