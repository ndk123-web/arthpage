// Part of Options Page - Renders the settings UI for the extension and handles saving/loading configuration
import { useState, useEffect, StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Moon, Sun, Save, Wifi, WifiOff } from "lucide-react"
import '../App.css' // Helper for Tailwind/Shadcn variables

// Define available models as constants
const MODEL_OPTIONS = {
    openai: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-3-flash-preview", "gemini-2.5-flash","gemini-2.0-flash"],
    deepseek: ["deepseek-chat", "deepseek-coder"],
    claude: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    ollama: ["llama3", "llama2", "mistral", "gemma", "phi3", "codellama"],
};

function Options() {
  const [isDark, setIsDark] = useState(false)
  const [activeTab, setActiveTab] = useState<"online" | "offline">("online")
  const [status, setStatus] = useState("")
  
  // State structure for settings
  const [settings, setSettings] = useState({
    activeProvider: "openai",
    providers: {
        openai: {apiKey: "", model: "gpt-4o"},
        gemini: {apiKey: "", model: "gemini-1.5-flash"},
        deepseek: {apiKey: "", model: "deepseek-chat"},
        claude: {apiKey: "", model: "claude-3-5-sonnet-20240620"},
        ollama: {url: "http://localhost:11434", model: "llama3"}
    }
  })

  useEffect(() => {
    // Theme init
    const savedTheme = localStorage.getItem("extension-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDark
    setIsDark(initialDark)
    
    // Apply class to html/body for full page theme
    if (initialDark) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }

    // Load Settings
    chrome.storage.sync.get(['provider', 'openai', 'gemini', 'deepseek', 'claude', 'ollama'], (result: any) => {
        setSettings((prev) => ({
            ...prev,
            activeProvider: result.provider || prev.activeProvider,
            providers: {
                openai: {
                    apiKey: result.openai?.apiKey || prev.providers.openai.apiKey,
                    model: result.openai?.model || prev.providers.openai.model
                },
                gemini: {
                    apiKey: result.gemini?.apiKey || prev.providers.gemini.apiKey,
                    model: result.gemini?.model || prev.providers.gemini.model
                },
                deepseek: {
                    apiKey: result.deepseek?.apiKey || prev.providers.deepseek.apiKey,
                    model: result.deepseek?.model || prev.providers.deepseek.model
                },  
                claude: {
                    apiKey: result.claude?.apiKey || prev.providers.claude.apiKey,
                    model: result.claude?.model || prev.providers.claude.model
                },
                ollama: {
                    url: result.ollama?.url || prev.providers.ollama.url,
                    model: result.ollama?.model || prev.providers.ollama.model
                }
            }
        }))
    })
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem("extension-theme", newTheme ? "dark" : "light")
    if (newTheme) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
  }

  // Handle saving settings flattened to sync storage
  const handleSave = () => {
    chrome.storage.sync.set({
        provider: settings.activeProvider,
        openai: settings.providers.openai,
        gemini: settings.providers.gemini,
        deepseek: settings.providers.deepseek,
        claude: settings.providers.claude,
        ollama: settings.providers.ollama,
    }, () => {
        setStatus("Settings saved successfully!")
        setTimeout(() => setStatus(""), 3000)
    })
  }

  // Helper to update specific provider settings
  const updateProviderSetting = (provider: keyof typeof settings.providers, key: string, value: string) => {
    setSettings(prev => ({
        ...prev,
        providers: {
            ...prev.providers,
            [provider]: {
                ...prev.providers[provider],
                [key]: value
            }
        }
    }))
  }

  const setProvider = (val: string) => {
      setSettings(prev => ({ ...prev, activeProvider: val }))
  }

  return (
    <div className={`min-h-screen w-full transition-colors flex justify-center p-4 md:p-8 ${isDark ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`w-full max-w-2xl rounded-xl border shadow-lg overflow-hidden h-fit ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <div>
                    <h1 className="text-2xl font-bold">Extension Settings</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure your AI providers</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <button 
                    onClick={() => setActiveTab('online')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'online' ? (isDark ? 'text-white bg-neutral-900/50' : 'text-black bg-white') : (isDark ? 'text-gray-500 hover:text-gray-300 bg-neutral-950' : 'text-gray-500 hover:text-gray-700 bg-gray-50')}`}
                >
                    <Wifi className="w-4 h-4" /> 
                    Online (OpenAI)
                    {activeTab === 'online' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('offline')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'offline' ? (isDark ? 'text-white bg-neutral-900/50' : 'text-black bg-white') : (isDark ? 'text-gray-500 hover:text-gray-300 bg-neutral-950' : 'text-gray-500 hover:text-gray-700 bg-gray-50')}`}
                >
                    <WifiOff className="w-4 h-4" /> 
                    Offline (Ollama)
                    {activeTab === 'offline' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>}
                </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6">
                {activeTab === 'online' ? (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">AI Provider</label>
                            <Select value={settings.activeProvider} onValueChange={setProvider}>
                                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                                    <SelectItem value="claude">Anthropic Claude</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Select the AI provider you want to use.</p>
                        </div>
                        
                        {settings.activeProvider === 'openai' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="space-y-3">
                                <label className="text-sm font-medium">Model Selection</label>
                                <Select 
                                    value={settings.providers.openai.model} 
                                    onValueChange={(val) => updateProviderSetting('openai', 'model', val)}
                                >
                                    <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                        {MODEL_OPTIONS.openai.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">OpenAI API Key</label>
                                <Input 
                                    type="password" 
                                    placeholder="sk-..." 
                                    value={settings.providers.openai.apiKey} 
                                    onChange={(e) => updateProviderSetting('openai', 'apiKey', e.target.value)}
                                    className={isDark ? "bg-neutral-900 border-neutral-800" : ""}
                                />
                            </div>
                        </div>
                        )}

                        {settings.activeProvider === 'gemini' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3">
                                <label className="text-sm font-medium">Model Selection</label>
                                <Select 
                                    value={settings.providers.gemini.model} 
                                    onValueChange={(val) => updateProviderSetting('gemini', 'model', val)}
                                >
                                    <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                        {MODEL_OPTIONS.gemini.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                                <div className="space-y-3">
                                <label className="text-sm font-medium">Gemini API Key</label>
                                <Input 
                                    type="password" 
                                    placeholder="AIza..." 
                                    value={settings.providers.gemini.apiKey} 
                                    onChange={(e) => updateProviderSetting('gemini', 'apiKey', e.target.value)}
                                    className={isDark ? "bg-neutral-900 border-neutral-800" : ""}
                                />
                                </div>
                            </div>
                        )}

                        {settings.activeProvider === 'deepseek' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3">
                                <label className="text-sm font-medium">Model Selection</label>
                                <Select 
                                    value={settings.providers.deepseek.model} 
                                    onValueChange={(val) => updateProviderSetting('deepseek', 'model', val)}
                                >
                                    <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                        {MODEL_OPTIONS.deepseek.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                                <div className="space-y-3">
                                <label className="text-sm font-medium">DeepSeek API Key</label>
                                <Input 
                                    type="password" 
                                    placeholder="sk-..." 
                                    value={settings.providers.deepseek.apiKey} 
                                    onChange={(e) => updateProviderSetting('deepseek', 'apiKey', e.target.value)}
                                    className={isDark ? "bg-neutral-900 border-neutral-800" : ""}
                                />
                                </div>
                            </div>
                        )}

                        {settings.activeProvider === 'claude' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3">
                                <label className="text-sm font-medium">Model Selection</label>
                                <Select 
                                    value={settings.providers.claude.model} 
                                    onValueChange={(val) => updateProviderSetting('claude', 'model', val)}
                                >
                                    <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                        {MODEL_OPTIONS.claude.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                                <div className="space-y-3">
                                <label className="text-sm font-medium">Claude API Key</label>
                                <Input 
                                    type="password" 
                                    placeholder="sk-ant-..." 
                                    value={settings.providers.claude.apiKey} 
                                    onChange={(e) => updateProviderSetting('claude', 'apiKey', e.target.value)}
                                    className={isDark ? "bg-neutral-900 border-neutral-800" : ""}
                                />
                                </div>
                            </div>
                        )}
                        
                        <div className="pb-2">
                             <p className="text-xs text-muted-foreground">Your key is stored securely in your browser's local sync storage and is never shared.</p>
                        </div>
                     </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Ensure Ollama is running (`ollama serve`) and is accessible.
                            </p>
                         </div>

                         <div className="space-y-3">
                            <label className="text-sm font-medium">Ollama Server URL</label>
                             <Input 
                                placeholder="http://localhost:11434" 
                                value={settings.providers.ollama.url} 
                                onChange={(e) => updateProviderSetting('ollama', 'url', e.target.value)}
                                className={isDark ? "bg-neutral-900 border-neutral-800" : ""}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Model Selection</label>
                             <Select 
                                value={settings.providers.ollama.model} 
                                onValueChange={(val) => updateProviderSetting('ollama', 'model', val)}
                             >
                                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent className={isDark ? "bg-neutral-900 border-neutral-800 text-white" : ""}>
                                    {MODEL_OPTIONS.ollama.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">This exact model name must be pulled locally via `ollama pull {settings.providers.ollama.model || '<model>'}`</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t flex justify-between items-center ${isDark ? 'border-neutral-800 bg-neutral-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className={`text-sm font-medium transition-opacity duration-300 ${status ? 'opacity-100 text-emerald-500' : 'opacity-0'}`}>
                    {status}
                </div>
                <Button onClick={handleSave} className={isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}>
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                </Button>
            </div>
        </div>
    </div>
  )
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Options />
    </StrictMode>
  );
}

export default Options;