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
import { X, Send, Bot, Moon, Sun } from "lucide-react";

// Types
type Message = {
  role: "user" | "assistant";
  content: string;
};

type Provider = "online" | "offline";

export default function Sidebar() {
  // Theme State
  const [isDark, setIsDark] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! How can I help you with this page today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings State
  const [provider, setProvider] = useState<Provider>("online");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

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

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("extension-theme", newTheme ? "dark" : "light");
  };

  const closeSidebar = () => {
    const root = document.getElementById("my-extension-sidebar-root");
    if (root) root.remove();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Mock response for now
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "I'm a basic placeholder. Connect me to " + (provider === 'online' ? "OpenAI/Gemini" : "Ollama") + " to get real responses!" }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={cn("fixed right-0 top-0 h-screen w-96 shadow-2xl z-[2147483647] font-sans antialiased transition-colors duration-300 flex flex-col border-l", isDark ? "dark bg-black text-gray-100 border-neutral-800" : "light bg-white text-gray-900 border-gray-200")}>
      
      {/* Header */}
      <div className={cn("flex items-center justify-between p-4 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60", isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white')}>
        <div className="flex items-center gap-2 font-semibold">
           <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shadow-sm", isDark ? 'bg-white text-black' : 'bg-black text-white')}>
             <Bot className="h-5 w-5" />
           </div>
           <span className="text-sm">Web Assistant</span>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-full hover:bg-neutral-800/50">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Messages Area - Flex Grow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm", 
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
            <Select value={provider} onValueChange={(val) => setProvider(val as Provider)}>
              <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300" : "bg-white border-gray-200")}>
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className={cn("z-[2147483648] border", isDark ? "dark border-neutral-800 bg-neutral-950 text-white" : "light border-gray-200 bg-white text-gray-950")}>
                <SelectItem value="online">Online (API)</SelectItem>
                <SelectItem value="offline">Offline (Local)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-neutral-900 border-neutral-800 text-gray-300" : "bg-white border-gray-200")}>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className={cn("z-[2147483648] border", isDark ? "dark border-neutral-800 bg-neutral-950 text-white" : "light border-gray-200 bg-white text-gray-950")}>
                  {provider === 'online' ? (
                      <>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      </>
                  ) : (
                      <>
                          <SelectItem value="llama3">Llama 3</SelectItem>
                          <SelectItem value="mistral">Mistral</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                      </>
                  )}
              </SelectContent>
            </Select>
        </div>

        {/* Dynamic Settings Fields - Only showing simplified for now */}
        {/* API Key Input Removed as requested */}
        {/* {provider === 'online' && (
             <Input 
                placeholder="Enter API Key" 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-8 text-xs bg-background/50"
             />
        )} */}
         {provider === 'offline' && (
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className={cn("min-h-[80px] pr-12 resize-none focus-visible:ring-1 shadow-sm", isDark ? "bg-neutral-900 border-neutral-800 text-gray-100 placeholder:text-neutral-500 focus-visible:ring-neutral-700" : "bg-white border-gray-200 text-gray-900")}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
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
                {provider === 'online' ? '🟢 Cloud Connected' : '🟠 Local Server'}
            </span>
            <span className={cn("opacity-70", isDark ? "text-neutral-400" : "text-gray-500")}>{model}</span>
        </div>
      </div>
    </div>
  );
}