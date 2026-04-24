import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Volume2, VolumeX, Loader2, X, Minimize2, Maximize2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: "algorithms" | "data" | "models" | "features" | "general" | "teams";
}

interface KnowledgeBase {
  [key: string]: {
    keywords: string[];
    response: string;
    category: "algorithms" | "data" | "models" | "features" | "general";
    followUp?: string[];
  };
}

const knowledgeBase: KnowledgeBase = {
  algorithms: {
    keywords: ["algorithm", "algo", "linear regression", "random forest", "lstm", "machine learning", "ml", "model", "models", "training", "accuracy", "r2", "mae", "performance"],
    response: "The CogniSense system uses advanced machine learning algorithms: 1) Linear Regression to map physical fatigue scores to mental fatigue predictions using the fatigueset dataset, and 2) Random Forest Regressor for cloud workload error rate prediction. Both models are continuously retrained with new data. The system achieves R² around 0.85 with MAE ~0.12 for fatigue prediction, and R² ~0.78 with MAE ~0.15 for workload prediction. Models automatically retrain based on data freshness and performance metrics.",
    category: "algorithms",
    followUp: ["model accuracy", "training data", "prediction endpoints", "retraining frequency", "model comparison", "fatigue prediction", "workload prediction"]
  },
  fatigue: {
    keywords: ["fatigue", "tired", "burnout", "exhaustion", "mental load", "cognitive load", "stress", "energy", "fatigue score", "mental fatigue", "physical fatigue", "recovery", "break", "rest"],
    response: "Fatigue monitoring in CogniSense uses real-time data from the fatigueset dataset to track both physical and mental fatigue levels. The system displays current fatigue scores, predicts burnout risk, and provides personalized recovery recommendations. The fatigue heatmap shows team-level cognitive load across 12 clusters using color-coded risk levels: Green (<40%), Yellow (40-70%), and Red (>70%). The system also tracks recovery blocks and their effectiveness in reducing fatigue levels.",
    category: "models",
    followUp: ["fatigue heatmap", "team fatigue levels", "high risk teams", "recovery blocks", "burnout forecast", "data source", "recovery recommendations"]
  },
  heatmap: {
    keywords: ["heatmap", "heat map", "team clusters", "risk visualization", "team risk", "cognitive load", "fatigue distribution", "team performance", "risk levels", "color coding", "green yellow red", "high risk", "moderate risk"],
    response: "The fatigue heatmap in CogniSense displays real-time cognitive load across 12 team clusters using color-coded risk levels: Green (<40% fatigue), Yellow (40-70% fatigue), and Red (>70% fatigue). Each cluster represents a different team or team segment. Data is aggregated from the fatigueset dataset and updates every 10 seconds. You can view individual team fatigue levels, identify high-risk teams, and track fatigue trends over time. The heatmap helps managers allocate resources and prevent burnout.",
    category: "features",
    followUp: ["team fatigue levels", "high risk teams", "data source", "fatigue trends", "resource allocation", "team clusters", "risk thresholds"]
  },
  models: {
    keywords: ["model", "models", "metrics", "accuracy", "r2", "mae", "performance", "prediction", "training", "retraining", "data", "dataset", "fatigueset", "model comparison"],
    response: "CogniSense model performance metrics are available via /api/train. The fatigue prediction model typically achieves R² around 0.85 with MAE ~0.12, while the cloud workload model shows R² ~0.78 with MAE ~0.15. Models automatically retrain based on data freshness and performance degradation. You can access current model versions, training history, and performance comparison through the ML Ops interface.",
    category: "models",
    followUp: ["retraining frequency", "model comparison", "prediction accuracy", "model versions", "training history", "performance metrics", "ml ops", "model management"]
  },
  recovery: {
    keywords: ["recovery", "break", "rest", "pause", "recovery block", "recovery system", "break schedule", "rest period", "recovery time", "recovery effectiveness"],
    response: "The Recovery Block System in CogniSense allows scheduling recovery breaks for any team or globally. The system recommends duration based on current fatigue levels (15-30 minutes for high fatigue). Use the Recovery Block System component to schedule breaks and track their effectiveness. Recovery blocks can be set for specific teams, departments, or the entire organization. The system analyzes recovery impact on subsequent fatigue levels and productivity.",
    category: "features",
    followUp: ["schedule recovery", "recovery recommendations", "break duration", "recovery effectiveness", "team recovery", "global recovery", "productivity impact"]
  },
  deadline: {
    keywords: ["deadline", "schedule", "shift", "extension", "timeline", "due date", "time management", "project timeline", "task scheduling"],
    response: "The deadline shift analyzer uses current team cognitive load to recommend schedule adjustments. It considers fatigue levels, workload distribution, and historical performance. Suggestions include confidence scores and reasoning. The system can analyze deadline feasibility based on current team capacity and fatigue levels. This helps prevent overcommitment and burnout.",
    category: "features",
    followUp: ["current recommendations", "confidence levels", "schedule feasibility", "workload distribution", "team capacity", "deadline management"]
  },
  workload: {
    keywords: ["workload", "distribution", "auto-distribute", "balance", "task allocation", "resource allocation", "team capacity", "work balance", "task management"],
    response: "Auto-distribute analyzes team capacity and suggests task reallocations to prevent burnout. It considers current cognitive load, skill requirements, and historical performance. Moves are categorized by impact level (high/medium/low). The system helps optimize workload distribution and ensures fair task assignment based on team members' current capacity and fatigue levels.",
    category: "features",
    followUp: ["current suggestions", "apply distribution", "impact analysis", "team capacity", "skill requirements", "workload optimization"]
  },
  authentication: {
    keywords: ["login", "signup", "auth", "verification", "email", "password", "security", "session", "role", "permission", "access control"],
    response: "The authentication system supports three roles: User, Admin, and Academic. It includes email verification, password hashing, session management, and role-based access control. All data is encrypted and sessions expire after 7 days. Different roles have different access levels to system features and data.",
    category: "features",
    followUp: ["role permissions", "security features", "session management", "access control", "user roles", "admin features"]
  },
  notifications: {
    keywords: ["notification", "alert", "notify", "warning", "threshold", "customization", "delivery methods", "alert settings"],
    response: "Real-time notifications alert you to high fatigue levels, work imbalances, and system events. You can customize alert thresholds, notification types, and delivery methods in the Settings page. Notifications help teams respond quickly to emerging issues and maintain awareness of system status.",
    category: "features",
    followUp: ["configure alerts", "notification types", "alert thresholds", "delivery methods", "customization options"]
  },
  settings: {
    keywords: ["settings", "preferences", "configure", "customize", "theme", "colors", "density", "appearance", "privacy", "anonymization", "data retention", "export", "import"],
    response: "Settings allow customization of appearance (theme, colors, density), notifications (types, thresholds), ML models (parameters, retraining), and privacy (anonymization, data retention). Settings can be exported/imported and persist across sessions. You can configure the system to match your organization's specific needs and compliance requirements.",
    category: "features",
    followUp: ["theme options", "privacy settings", "ml parameters", "customization features", "appearance settings", "data management"]
  },
  teams: {
    keywords: ["team", "teams", "clusters", "ml-ops team", "design team", "research team", "academic", "industrial", "general", "team members", "team performance", "team allocation"],
    response: "CogniSense supports multiple team types: Academic (Lab Alpha, Lab Beta, Graduate Research Team), Industrial (Operations A, Operations B, Quality & Safety), and General (Public Services, Compliance Unit, Training & Development). Each team has different access levels and can be monitored individually. The system displays team-specific fatigue levels and performance metrics.",
    category: "teams",
    followUp: ["team types", "team performance", "team allocation", "academic teams", "industrial teams", "team monitoring"]
  },
  "cognisense": {
    keywords: ["cognisense", "system", "overview", "introduction", "features", "capabilities", "what is", "how it works", "purpose"],
    response: "CogniSense is an advanced cognitive workload and fatigue management system that uses machine learning to predict burnout risk and optimize team performance. It combines real-time monitoring, predictive analytics, and intelligent recommendations to help organizations maintain productivity while preventing employee burnout. The system processes data from multiple sources including physical sensors, work patterns, and team metrics.",
    category: "general",
    followUp: ["system overview", "key features", "benefits", "use cases", "implementation", "data sources", "technical details"]
  },
  "data sources": {
    keywords: ["data", "dataset", "fatigueset", "sources", "input", "sensors", "monitoring", "collection", "data quality"],
    response: "The system primarily uses the fatigueset dataset for training and predictions. Additional data sources include real-time sensor inputs, work pattern analysis, team performance metrics, and historical fatigue data. All data is processed using advanced ML pipelines with quality checks and validation.",
    category: "data",
    followUp: ["fatigueset details", "data quality", "sensor inputs", "data processing", "ml pipelines", "data validation"]
  },
  "ui elements": {
    keywords: ["ui", "interface", "dashboard", "layout", "components", "widgets", "cards", "charts", "gauges", "navigation", "menu", "sidebar"],
    response: "The CogniSense interface features a main dashboard with multiple widgets including cognitive energy meters, fatigue heatmaps, team cluster views, and real-time notifications. The UI uses modern design patterns with responsive layouts and customizable themes. Key components include summary cards, radial gauges, navigation menus, and interactive charts for data visualization.",
    category: "features",
    followUp: ["dashboard layout", "widgets", "charts", "navigation", "customization", "responsive design"]
  },
  "technical specs": {
    keywords: ["technical", "specs", "requirements", "performance", "scalability", "infrastructure", "deployment", "architecture", "technologies", "stack"],
    response: "CogniSense is built with React, TypeScript, and modern web technologies. The system supports real-time data processing with WebSocket connections for live updates. It uses advanced ML models with optimized inference pipelines. The backend provides RESTful APIs for data access and model training. The system is designed for scalability and can handle enterprise-level workloads.",
    category: "general",
    followUp: ["technology stack", "system architecture", "performance optimization", "api endpoints", "deployment options"]
  },
  "current values": {
    keywords: ["current", "values", "status", "metrics", "kpi", "performance", "dashboard", "real-time", "live data", "current state"],
    response: "I can access current system values and metrics displayed in the UI. The dashboard shows real-time fatigue levels, team cognitive load, model performance metrics, and system status. Current values include fatigue percentages, risk levels, team performance scores, and alert statuses. Ask me about any specific metric or value you see on screen.",
    category: "general",
    followUp: ["fatigue levels", "team metrics", "system status", "performance indicators", "real-time data"]
  },
  "help and support": {
    keywords: ["help", "support", "troubleshooting", "issues", "problems", "errors", "documentation", "guide", "tutorial"],
    response: "For technical support, I can help troubleshoot common issues with voice recognition, model performance, data connectivity, and UI navigation. The system includes comprehensive logging and error handling. For user guides, I can explain how to use different features and interpret the various metrics and visualizations. Contact support for complex issues or feature requests.",
    category: "general",
    followUp: ["troubleshooting", "feature guides", "system diagnostics", "user manuals", "contact support"]
  }
};

interface ChatbotProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Chatbot({ forceOpen, onOpenChange }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm your CogniSense™ assistant. I can explain algorithms, models, features, and help you navigate to system. What would you like to know about?",
      timestamp: new Date(),
      category: "general"
    }
  ]);
  const [text, setText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastContext, setLastContext] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const toggleOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } finally {
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (typeof forceOpen === "boolean") {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setText(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {
        // no-op: recognition may already be stopped
      }
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onVoiceQuery = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const query = customEvent.detail?.trim();
      if (!query) return;
      setIsOpen(true);
      onOpenChange?.(true);
      setMessages((m) => [
        ...m,
        { role: "user", content: query, timestamp: new Date() },
      ]);
      void answer(query);
    };

    window.addEventListener("cognisense-voice-query", onVoiceQuery as EventListener);
    return () => window.removeEventListener("cognisense-voice-query", onVoiceQuery as EventListener);
  }, []);

  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const ziraVoice = voices.find(v => v.name.includes('Microsoft Zira'));
      voiceRef.current = ziraVoice || null;
      console.log("[Chatbot] Selected Zira voice:", ziraVoice?.name);
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findBestMatch = (query: string): { key: string; confidence: number } | null => {
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let highestConfidence = 0;

    Object.entries(knowledgeBase).forEach(([key, data]) => {
      let confidence = 0;
      const words = lowerQuery.split(' ');
      
      // Check for exact keyword matches
      data.keywords.forEach(keyword => {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          confidence += keyword.length / query.length;
        }
      });

      // Check for partial word matches
      words.forEach(word => {
        data.keywords.forEach(keyword => {
          const similarity = word.length > 0 ? 
            (keyword.toLowerCase().split('').filter(char => word.toLowerCase().includes(char)).length) / Math.max(word.length, keyword.length) : 0;
          if (similarity > 0.7) {
            confidence += similarity * 0.5;
          }
        });
      });

      // Prioritize recovery over fatigue for ambiguous queries
      if (key === "recovery" && confidence > 0.3) {
        confidence += 0.5; // Boost recovery category confidence
      }
      
      if (confidence > highestConfidence && confidence > 0.3) {
        highestConfidence = confidence;
        bestMatch = { key, confidence };
      }
    });

    return bestMatch;
  };

  const generateResponse = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase().trim();
    const affirmatives = ["yes", "yeah", "sure", "ok", "okay", "continue", "tell me more", "go on", "yes please", "please"];
    
    // Check if this is an affirmative follow-up
    if (lastContext && affirmatives.some(a => lowerQuery === a || lowerQuery.startsWith(a))) {
      const contextData = knowledgeBase[lastContext];
      if (contextData && contextData.followUp) {
        // Find a random follow-up that isn't the current response
        const nextTopic = contextData.followUp[Math.floor(Math.random() * contextData.followUp.length)];
        // Find the knowledge base entry for the next topic
        const nextMatch = Object.entries(knowledgeBase).find(([key, data]) => 
          key.toLowerCase() === nextTopic.toLowerCase() || 
          data.keywords.some(k => nextTopic.toLowerCase().includes(k.toLowerCase()))
        );
        
        if (nextMatch) {
          setLastContext(nextMatch[0]);
          return `Great! Let's talk about ${nextTopic}. ${knowledgeBase[nextMatch[0]].response}`;
        }
        return `Regarding ${nextTopic}: I can tell you more about how it works within our system. Would you like to explore another area?`;
      }
    }

    const match = findBestMatch(query);
    
    if (match) {
      setLastContext(match.key);
      const data = knowledgeBase[match.key];
      let response = data.response;
      
      // Add contextual information based on real-time data
      if (match.key === "fatigue" || match.key === "heatmap") {
        try {
          const res = await fetch("/api/heatmap");
          const heatmapData = await res.json();
          if (heatmapData.items) {
            const highRiskTeams = heatmapData.items.filter((i: any) => i.risk >= 0.7);
            if (highRiskTeams.length > 0) {
              response += ` Currently, ${highRiskTeams.length} teams are in the high-risk zone.`;
            }
          }
        } catch (error) {
          // Continue with default response
        }
      }

      // Add follow-up suggestions
      if (data.followUp && data.followUp.length > 0) {
        response += ` Would you like to know more about ${data.followUp.slice(0, 2).join(' or ')}?`;
      }

      return response;
    }

    setLastContext(null);
    // Fallback responses for unknown queries
    const fallbackResponses = [
      "I can help you understand the algorithms, models, and features of CogniSense™. Try asking about fatigue monitoring, the heatmap, recovery blocks, or deadline management.",
      "I'm knowledgeable about the system's machine learning models, data sources, and features. Ask me about algorithms, the fatigueset dataset, or any specific component.",
      "I can explain how the different features work together - from real-time monitoring to recovery recommendations. What specific aspect interests you?"
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };

  const answer = async (q: string) => {
    setIsTyping(true);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const response = await generateResponse(q);
    const match = findBestMatch(q);
    
    const newMessage: ChatMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date(),
      category: match ? knowledgeBase[match.key].category : "general"
    };
    
    setMessages((m) => [...m, newMessage]);
    setIsTyping(false);
    
    speak(response);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    // Resolve voice at call-time to avoid stale/null ref when voices load late.
    const voices = window.speechSynthesis.getVoices();
    const ziraVoice = voices.find(v => v.name.includes("Microsoft Zira")) || voiceRef.current;
    if (!ziraVoice || !ziraVoice.name.includes("Microsoft Zira")) {
      console.warn("[Chatbot] Zira voice unavailable, skipping response speech.");
      return;
    }
    voiceRef.current = ziraVoice;

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = ziraVoice;
    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.volume = 0.9;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utter);
  };

  const onSend = async () => {
    const q = text.trim();
    if (!q || isTyping) return;
    
    const userMessage: ChatMessage = {
      role: "user",
      content: q,
      timestamp: new Date()
    };
    
    setMessages((m) => [...m, userMessage]);
    setText("");
    await answer(q);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "algorithms": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "models": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "features": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "data": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => toggleOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 z-50 group"
      >
        <div className="absolute -top-12 right-0 bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Need help? Ask FriDaY
        </div>
        <img src="/CS_LOGO.jpg" alt="FriDaY" className="w-8 h-8 rounded-lg object-cover" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-destructive border-2 border-background rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300 shadow-2xl overflow-hidden border border-border/50",
      isMinimized ? "w-72 h-14" : "w-80 sm:w-96 h-[500px] flex flex-col"
    )}>
      <CardHeader className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/CS_LOGO.jpg" alt="FriDaY logo" className="w-8 h-8 rounded-lg object-cover border border-border/50" />
            <div>
              <CardTitle className="text-sm font-bold">FriDaY</CardTitle>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online & Processing</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleOpen(false)}
              className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-background">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                    m.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {m.role === "assistant" && m.category && (
                      <Badge className={cn("text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter", getCategoryColor(m.category))}>
                        {m.category}
                      </Badge>
                    )}
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                  <div className={cn(
                    "text-xs p-3 rounded-2xl shadow-sm",
                    m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none border border-border/50"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-muted/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative group">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    className="pr-20 h-10 rounded-xl bg-background border-border/50 group-focus-within:border-primary transition-all shadow-sm"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={!recognitionRef.current}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onSend}
                      disabled={!text.trim() || isTyping}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-30"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      voiceEnabled ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{voiceEnabled ? "Voice ON" : "Muted"}</span>
                  </button>
                </div>
                <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
                  AI Knowledge Engine
                </div>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
