import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
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
  const [apiKey, setApiKey] = useState("");
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
    <div className={cn("fixed right-0 top-0 h-screen w-96 shadow-2xl z-[2147483647] font-sans antialiased transition-colors duration-300 flex flex-col border-l", isDark ? "dark bg-background text-foreground border-border" : "light bg-background text-foreground border-border")}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-semibold">
           <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
             <Bot className="h-5 w-5" />
           </div>
           <span className="text-sm">Web Assistant</span>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-full">
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
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-muted text-foreground border rounded-bl-none")}>
                    {msg.content}
                </div>
            </div>
        ))}
        {loading && (
             <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="rounded-2xl rounded-bl-none px-4 py-2 bg-muted text-muted-foreground text-xs animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-0"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-300"></span>
                </div>
             </div>
        )}
      </div>

      {/* Settings & Input Area */}
      <div className="p-4 border-t bg-muted/20 space-y-3">
        
        {/* Model Selector Bar */}
        <div className="grid grid-cols-2 gap-2">
            <Select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="h-8 text-xs bg-background/50"
            >
                <option value="online">Online (API)</option>
                <option value="offline">Offline (Local)</option>
            </Select>

            <Select 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="h-8 text-xs bg-background/50"
            >
                {provider === 'online' ? (
                    <>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </>
                ) : (
                    <>
                        <option value="llama3">Llama 3</option>
                        <option value="mistral">Mistral</option>
                        <option value="custom">Custom</option>
                    </>
                )}
            </Select>
        </div>

        {/* Dynamic Settings Fields - Only showing simplified for now */}
        {provider === 'online' && (
             <Input 
                placeholder="Enter API Key" 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-8 text-xs bg-background/50"
             />
        )}
         {provider === 'offline' && (
             <Input 
                placeholder="Ollama URL (http://localhost:11434)" 
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="h-8 text-xs bg-background/50"
             />
        )}

        {/* Chat Input */}
        <div className="relative">
            <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[80px] pr-12 resize-none bg-background focus-visible:ring-1 shadow-sm"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <Button 
                size="icon" 
                className="absolute bottom-2 right-2 h-8 w-8 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                onClick={handleSend}
                disabled={!input.trim() || loading}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-medium">
            <span className="flex items-center gap-1 opacity-70">
                {provider === 'online' ? '🟢 Cloud Connected' : '🟠 Local Server'}
            </span>
            <span className="opacity-70">{model}</span>
        </div>
      </div>
    </div>
  );
}