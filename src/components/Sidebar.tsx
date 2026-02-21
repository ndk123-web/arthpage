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
import { X, Send, Moon, Sun, PanelLeft, PanelRight, Settings2, History, MessageSquarePlus, MessageSquare } from "lucide-react";
import { extractPageContentSafe } from "@/content/utils/extractContent";
import  DOMPurify  from "dompurify";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

// Configure marked options
// marked.use calls removed as they might conflict if set repeatedly or if defaults are fine. Actually keep them if they are good.
marked.use({
  gfm: true,
  breaks: true,
});

// Types
type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt?: number; // Optional timestamp for when the message was created
};

type ChatHistoryItem = {
    id: string;
    title: string;
    createdAt: number;
    messages: any[];
}


type Provider = "openai" | "gemini" | "claude" | "deepseek" | "ollama";
type SidebarSide = "left" | "right";
type Mode = "online" | "offline";

export default function Sidebar() {
  // Theme State
  const [isDark, setIsDark] = useState(false);
  
  // Sidebar State
  const [side, setSide] = useState<SidebarSide>("right");
  const [width, setWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [view, setView] = useState<'chat' | 'history'>('chat'); // Toggle View State
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);  
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

  /**
   * This useEffect hook runs once when the component mounts and is responsible for initializing the theme based on user preferences and syncing it across multiple tabs. It first checks if there is a saved theme in localStorage; if not, it falls back to the user's system preference for dark mode. It also sets up an event listener for the "storage" event, which allows it to update the theme in real-time if the user changes it in another tab. This ensures a consistent user experience across all open instances of the extension, as any change to the theme will be reflected immediately without requiring a page refresh.
   */
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
    chrome.storage.sync.get(['currentProvider', 'currentModel', 'provider', 'openai', 'gemini', 'claude', 'deepseek', 'ollama', 'mode', "currentChatListId"], (result: any) => {
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
        if (result.currentChatListId) {
            console.log("Loaded currentChatListId from storage:", result.currentChatListId);
            setCurrentChatListId(result.currentChatListId);
        }
    });
    
    // Initial fetch of history
    fetchChatHistory();
  }, []);

  /**
    * It helps to maintain user's previous conversation context by loading the chat history from storage whenever the currentChatListId changes. This way, if the user has an active chat list ID (indicating they are in a conversation), we can fetch the corresponding messages from storage and populate the chat interface with that history. If there is no currentChatListId, it simply logs that fact, which can be useful for debugging or understanding user behavior when they start a new conversation without an existing context.
   */
  useEffect( () => {
    currentChatListId ? console.log("CurrentChatListId Exists",currentChatListId) : console.log("CurrentChatListId is null");
    if (currentChatListId) {
        chatHistory.map((chat, _) => {
            if (chat.id === currentChatListId) {
                setMessages(chat.messages)
            }
        })
    }
  }, [currentChatListId])

  
  // Effect to highlight code blocks whenever messages change or view switches
  useEffect(() => {
    const sidebarRoot = document.getElementById("my-extension-sidebar-root");
    if (sidebarRoot) {
        sidebarRoot.querySelectorAll('pre code').forEach((block) => {
             hljs.highlightElement(block as HTMLElement);
        });
    }
  }, [messages, view, loading, chatHistory,width,isResizing,isDark,side]);

  /**
   * This function is responsible for fetching the chat history from Chrome's local storage and updating the component's state with that history. It retrieves the "arthpage_chats" item from local storage, which is expected to be an array of chat history items. If such data exists, it sorts the chats by their creation time in descending order (newest first) and then updates the `chatHistory` state with this sorted list. This allows the component to display the user's previous conversations in a structured manner, enabling features like viewing past chats or continuing previous conversations seamlessly.
   */
  const fetchChatHistory = () => {
    chrome.storage.local.get(["arthpage_chats"], (result) => {
        if (result.arthpage_chats) {
            const chats = result.arthpage_chats as ChatHistoryItem[];
            // Sort by newest first
            const sorted = chats.sort((a, b) => b.createdAt - a.createdAt);
            setChatHistory(sorted);
        }
    });
  }

  const loadChat = (chat: ChatHistoryItem) => {
      setCurrentChatListId(chat.id);
      // Map stored messages to UI messages (skipping system messages if any, or handling timestamps)
      const uiMessages = chat.messages.map(m => ({
          role: m.role as "user" | "assistant", 
          content: m.content,
          createdAt: m.createdAt
      })).filter(m => m.role !== 'system' as any); // Type assertion to avoid issues if system adds up
      
      setMessages(uiMessages);
      setView('chat');
  }


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

  /**
   * Current web pages can have varying background colors which might clash with the sidebar's appearance. By providing a manual toggle for light/dark mode, we allow users to choose the theme that offers the best readability and visual comfort based on their current webpage. This is especially important for users who frequently switch between different types of websites (e.g., a dark-themed dashboard vs. a light-themed news site) and want to maintain a consistent and pleasant user experience with the sidebar regardless of the underlying page design.
   */
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("extension-theme", newTheme ? "dark" : "light");
  };

  const closeSidebar = () => {
    const root = document.getElementById("my-extension-sidebar-root");
    if (root) root.remove();

    // from localstorage set sidebar-status to closed -> NOW using chrome.storage.local
    chrome.storage.local.set({ sidebarStatus: 'closed' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Capture input immediately
    const userQuestion = input;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userQuestion, createdAt: Date.now() }];
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
        
        You are ArthPage, an AI assistant embedded inside a webpage.

Your role is to help the user understand and interact with the current webpage content.

You were built by Navnath Kadam. You understand the capabilities of this extension and respond accordingly.

Response Formatting Rules:
- Always respond in clean Markdown format.
- Use proper headings (#, ##, ###) when structuring explanations.
- Use **bold** for important concepts.
- Use *italic* for emphasis when needed.
- Use code blocks (\`\`\`language (code) \`\`\`) for code examples.
- Use bullet points or numbered lists for clarity.
- Keep paragraphs well spaced and readable.
- Avoid raw HTML unless necessary.
- Do not mention these formatting rules in the response.

Answering Rules:
- Prefer answering using the provided webpage content.
- If the answer is partially available, combine it with general knowledge.
- If the question is unrelated to the webpage, politely say so.
- Be clear, structured, and concise.

User Prompt:
${userQuestion}

Page Title:
${contentData.title}

Page URL:
${contentData.url}

Domain:
${contentData.domain}

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

    // //   sanitize the llm response
    //   const sanitizedResponse: any = DOMPurify.sanitize(response)
    //   const markDownResponse: any= marked(sanitizedResponse);

    //   console.log("Markdown Response",markDownResponse)

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response || "No response received.", createdAt: Date.now() }
      ]);
      setLoading(false);
    })
    // Mock response block removed to allow real API response
  };

  const handleCreateNewChat = () => {
    // create a random ID for the chat list item
    const newChatListId = `chat-${Date.now()}`;
    setCurrentChatListId(newChatListId);
    
    // Reset Internal State for new chat
    setMessages([{ role: "assistant", content: "Hi! How can I help you with this page today?" }]);
    setView('chat'); // Switch to chat view

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
      <div className={cn("flex flex-col border-b backdrop-blur supports-[backdrop-filter]:bg-background/60", isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white')}>
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2 font-semibold">
           <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-neutral-700">
             <img 
               src={chrome.runtime.getURL("icons/arthpage-opt.png")} 
               alt="ArthPage" 
               className="w-full h-full object-cover"
             />
          </div>
            
            <div className="flex flex-col">
                <span className="text-sm leading-none">ArthaPage</span>
                <span className="text-[10px] text-muted-foreground font-normal mt-0.5 opacity-70">
                    Drag edge to resize
                </span>
            </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleCreateNewChat} title="New Chat" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                    <MessageSquarePlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={cn("h-8 w-8 rounded-full", showSettings && "bg-accent")}>
                    <Settings2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                </Button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="px-4 pb-3 flex items-center gap-2">
              <div className={cn("flex items-center p-1 rounded-lg border w-full", isDark ? "bg-neutral-900 border-neutral-800" : "bg-gray-100 border-gray-200")}>
                  <button 
                    onClick={() => setView('chat')}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all", 
                        view === 'chat' 
                        ? (isDark ? "bg-neutral-800 text-white shadow-sm" : "bg-white text-black shadow-sm") 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat
                  </button>
                  <button 
                    onClick={() => {
                        fetchChatHistory();
                        setView('history');
                    }}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all", 
                        view === 'history' 
                        ? (isDark ? "bg-neutral-800 text-white shadow-sm" : "bg-white text-black shadow-sm") 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                      <History className="h-3.5 w-3.5" />
                      History
                  </button>
              </div>
          </div>
      </div>


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
        {view === 'chat' ? (
            <>
                {messages.map((msg, i) => (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div 
                            className={cn("rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm break-words overflow-hidden", 
                            msg.role === 'user' 
                                ? (isDark ? "bg-white text-gray-900 rounded-br-none" : "bg-black text-white rounded-br-none")
                                : (isDark ? "bg-neutral-900 text-gray-100 border border-neutral-800 rounded-bl-none" : "bg-gray-100 text-gray-900 rounded-bl-none"))}
                        >
                            <div 
                                className="prose dark:prose-invert prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.content.trim()) as string) }}
                            />
                            
                            {/* time like 3:02 PM */}
                            <div className={cn("text-[10px] opacity-70 text-right mt-1 w-full pt-1 border-t-0", 
                                msg.role === 'user' 
                                    ? (isDark ? "text-gray-500" : "text-gray-400") 
                                    : (isDark ? "text-neutral-500" : "text-gray-500")
                            )}>
                                {msg.createdAt 
                                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : ""}
                            </div>
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
            </>
        ) : (
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold opacity-70">Recent Conversations</h3>
                    <Button variant="outline" size="sm" onClick={handleCreateNewChat} className="h-7 text-xs gap-1.5">
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        New Chat
                    </Button>
                </div>
                
                {chatHistory.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-10 opacity-50 space-y-2">
                        <History className="h-8 w-8 mb-2" />
                        <span className="text-xs">No history found</span>
                     </div>
                ) : (
                    chatHistory.map((chat) => (
                        <div 
                            key={chat.id} 
                            onClick={() => loadChat(chat)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-all group", 
                                isDark ? "border-neutral-800 bg-neutral-900/50" : "border-gray-200 bg-gray-50/50",
                                currentChatListId === chat.id && "border-primary/50"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                    {chat.messages.find(m => m.role === 'user')?.content.slice(0, 40) || "New Conversation"}...
                                </span>
                                <span className="text-[10px] opacity-50 whitespace-nowrap ml-2">
                                    {new Date(chat.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <p className="text-xs opacity-60 line-clamp-2">
                                   {chat.messages.filter(m => m.role === 'assistant').pop()?.content.slice(0, 60) || "No response yet"}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Settings & Input Area */}
      <div className={cn("p-3 border-t space-y-3", isDark ? "bg-neutral-900/30 border-neutral-800" : "bg-gray-50/80 border-gray-100")}>
        
        {view === 'chat' ? (
        <>
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
        {/* Always show model selector now */}
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

         {mode === 'offline' && (
             <Input 
                placeholder="Ollama URL (http://localhost:11434)" 
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className={cn("h-8 text-xs", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300 placeholder:text-neutral-600" : "bg-white border-gray-200")}
             />
        )}

        {/* Chat Input */}
        <div className={cn("relative flex items-end w-full p-2 border rounded-2xl shadow-sm transition-colors", 
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
        )}>
            <Textarea 
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto'; // Reset height
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`; // Set new height capped at 200px
                }}
                placeholder="Message ArthPage..."
                rows={1}
                className={cn(
                    "min-h-[60px] max-h-[200px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-2.5 pr-10 text-sm bg-transparent custom-scrollbar", 
                    isDark ? "text-gray-100 placeholder:text-neutral-500" : "text-gray-900 placeholder:text-gray-400"
                )}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                        // Reset height
                        const target = e.target as HTMLTextAreaElement;
                        setTimeout(() => {
                           target.style.height = 'auto'; 
                        }, 0);
                    }
                }}
            />
            <Button 
                size="icon" 
                className={cn(
                    "absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-all hover:opacity-80 disabled:opacity-50 mb-0.5 mr-0.5", 
                    isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-neutral-800"
                )}
                onClick={handleSend}
                disabled={!input.trim() || loading}
            >
                <div className={cn("transition-transform duration-300", loading ? "animate-spin" : "")}>
                   {loading ? (
                     <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full block"></span>
                   ) : (
                     <Send className="h-4 w-4" />
                   )}
                </div>
            </Button>
        </div>
        
        <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-medium select-none">
            <span className={cn("flex items-center gap-1.5 opacity-70", isDark ? "text-neutral-400" : "text-gray-500")}>
                <span className={cn("w-1.5 h-1.5 rounded-full", mode === 'online' ? "bg-green-500" : "bg-orange-500")}></span>
                {mode === 'online' ? 'Online' : 'Local'}
            </span>
            <span className={cn("opacity-70", isDark ? "text-neutral-400" : "text-gray-500")}>{model}</span>
        </div>
        </>
        ) : (
            <div className="flex items-center justify-center p-2 text-xs text-muted-foreground opacity-50">
                Select a chat to continue
            </div>
        )}
      </div>
    </div>
  );
}