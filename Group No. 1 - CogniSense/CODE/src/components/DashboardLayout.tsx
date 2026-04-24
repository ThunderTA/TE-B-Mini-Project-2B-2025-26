import { useEffect, useRef, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import CognitiveEnergyMeter from "@/components/CognitiveEnergyMeter";
import WorkBalanceMonitor from "@/components/WorkBalanceMonitor";
import NotificationCenter from "@/components/NotificationCenter";
import RadialGauge from "@/components/RadialGauge";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";
import { Search, X, Mic, MicOff, LogOut, Pause, Play, Menu } from "lucide-react";
import { useView } from "@/contexts/ViewContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchItems = [
  { label: "Dashboard", path: "/", group: "Pages" },
  { label: "Cognitive Load Analysis", path: "/cognitive-load", group: "Pages" },
  { label: "Team Clusters", path: "/team-clusters", group: "Pages" },
  { label: "Privacy Guard", path: "/privacy-guard", group: "Pages" },
  { label: "Fatigue Recon", path: "/fatigue-recon", group: "Pages" },
  { label: "Settings", path: "/settings", group: "Pages" },
  { label: "User Profile", path: "/profile", group: "Pages" },
  { label: "Burnout Forecast", path: "/", group: "Widgets" },
  { label: "Fatigue Heatmap", path: "/", group: "Widgets" },
  { label: "Context Advisor", path: "/", group: "Widgets" },
  { label: "ML-Ops Team", path: "/team-clusters", group: "Teams" },
  { label: "Design Team", path: "/team-clusters", group: "Teams" },
  { label: "Research Team", path: "/team-clusters", group: "Teams" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  showMetrics?: boolean;
}

export default function DashboardLayout({ children, showMetrics = true }: DashboardLayoutProps) {
  const { logout, user, updateUser, isLoading } = useAuth();
  const { ambience, setAmbience, theme, setTheme } = useView();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);

  const [voiceActive, setVoiceActive] = useState(true);

  const [bgAudioEnabled, setBgAudioEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("bgAudioEnabled") === "true"; } catch { return true; }
  });
  const [bgPaused, setBgPaused] = useState<boolean>(() => {
    try { return localStorage.getItem("bgPaused") === "true"; } catch { return false; }
  });

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const lastCmdRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const isRecognizingRef = useRef<boolean>(false);
  const watchdogRef = useRef<number | null>(null);
  const shouldRestartRef = useRef<boolean>(true);
  const manualStopRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const lastStartAttemptRef = useRef<number>(0);
  const lastRestartAtRef = useRef<number>(0);
  const restartBackoffRef = useRef<number>(50);
  const lastProcessTimeRef = useRef<number>(0);

  const isSpeakingRef = useRef(false);

  const speak = (text: string): Promise<void> => {
    if (!("speechSynthesis" in window)) return Promise.resolve();
    console.log("[Voice] Attempting to speak:", text);

    const ziraVoice = voiceRef.current;
    if (!ziraVoice || !ziraVoice.name.includes("Microsoft Zira")) {
      console.warn("[Voice] Microsoft Zira not found. Skipping speech to avoid non-Zira voice.");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = ziraVoice;
      u.rate = 0.95;
      u.pitch = 1.05;
      u.volume = 0.9;

      u.onstart = () => {
        console.log("[Voice] Speech started with Zira voice");
        isSpeakingRef.current = true;
      };
      u.onend = () => {
        console.log("[Voice] Speech ended");
        isSpeakingRef.current = false;
        resolve();
      };
      u.onerror = (e: SpeechSynthesisErrorEvent) => {
        console.error("[Voice] Speech error:", e);
        isSpeakingRef.current = false;
        resolve();
      };

      window.speechSynthesis.speak(u);
    });
  };

  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("[Voice] Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      // ONLY use Microsoft Zira voice - hardcoded to prevent any voice changes
      const ziraVoice = voices.find(v => v.name.includes('Microsoft Zira'));
      voiceRef.current = ziraVoice || null;
      console.log("[Voice] Selected voice:", voiceRef.current?.name, voiceRef.current?.lang);
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  // Ensure any speech from a previous page lifetime is stopped on load/refresh.
  useEffect(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    const onBeforeUnload = () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (voiceSupported && recognitionRef.current) {
      if (!voiceActive) {
        manualStopRef.current = true;
        if (isRecognizingRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {}
        }
      }
    }
  }, [voiceSupported, voiceActive]);

  const teamsBySector: Record<'academic' | 'industrial' | 'general', { id: string; name: string }[]> = {
    academic: [
      { id: "lab-alpha", name: "Lab Alpha" },
      { id: "lab-beta", name: "Lab Beta" },
      { id: "grad-team", name: "Graduate Research Team" },
    ],
    industrial: [
      { id: "ops-a", name: "Operations A" },
      { id: "ops-b", name: "Operations B" },
      { id: "quality", name: "Quality & Safety" },
    ],
    general: [
      { id: "public-services", name: "Public Services" },
      { id: "compliance", name: "Compliance Unit" },
      { id: "training", name: "Training & Development" },
    ],
  };

  const voiceActiveRef = useRef(true);
  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    const SpeechRecognitionCtor: new () => ISpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setVoiceSupported(true);
      const rec = new SpeechRecognitionCtor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      const queueRestart = (delayMs: number) => {
        if (!voiceActiveRef.current) return;
        if (restartTimeoutRef.current != null) {
          window.clearTimeout(restartTimeoutRef.current);
        }
        // Prevent rapid restart loops - only restart if enough time has passed
        const now = Date.now();
        if (now - lastRestartAtRef.current < 1000) return; // Don't restart if restarted within last second
        if (isStartingRef.current) return;
        lastRestartAtRef.current = now;
        restartTimeoutRef.current = window.setTimeout(() => {
          if (!voiceActiveRef.current || !recognitionRef.current) return;
          try {
            isStartingRef.current = true;
            recognitionRef.current.start();
          } catch (err) {
            console.log("[Voice] Restart failed:", err);
          }
        }, delayMs);
      };

      rec.onstart = () => {
        console.log("[Voice] Started");
        if (restartTimeoutRef.current != null) {
          window.clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        isStartingRef.current = false;
        restartBackoffRef.current = 900;
        isRecognizingRef.current = true;
        shouldRestartRef.current = true;
      };
      rec.onresult = (event: ISpeechRecognitionEvent) => {
        if (isSpeakingRef.current) return;
        try {
          const list = event.results;
          const startIdx = event.resultIndex;
          for (let i = startIdx; i < list.length; i++) {
            const alt = list[i][0];
            const t = String(alt?.transcript || "").toLowerCase().trim();
            if (!t) continue;
            
            // Only process high-confidence speech to avoid false triggers
            if ((alt as any).confidence < 0.7) {
              console.log("[Voice] Low confidence speech, ignoring:", t, (alt as any).confidence);
              continue;
            }
            
            // Speed: Handle "hey friday" and "open [page]" on interim results
            const isInterim = !list[i].isFinal;
            const hasWakeWord = t.includes("hey friday");
            const hasOpenCommand = t.includes("open ") || t.includes("show ") || t.includes("go to ");

            if (isInterim) {
              if (hasWakeWord || hasOpenCommand) {
                const now = Date.now();
                if (now - lastCmdRef.current.at > 200) {
                  lastCmdRef.current = { text: t, at: now };
                  handleCommand(t);
                }
              }
            } else {
              // Final result: Always process
              handleCommand(t);
            }
          }
        } catch (err) {
          console.error("[Voice Error] result error:", err);
        }
      };
      rec.onend = () => {
        console.log("[Voice] Ended");
        isRecognizingRef.current = false;
        isStartingRef.current = false;
        // Always restart when voice is active - no conditions
        if (voiceActiveRef.current) {
          queueRestart(10);
        }
      };
      rec.onerror = (e: any) => {
        console.log("[Voice] Error:", e.error);
        isRecognizingRef.current = false;
        isStartingRef.current = false;
        
        if (e.error === 'not-allowed') {
          setVoiceActive(false);
          localStorage.setItem("voiceActive", "false");
          return;
        }
        // 'aborted' is commonly followed by onend; don't treat it as a restart trigger.
        if (e.error === "aborted") {
          return;
        }
        if (!manualStopRef.current && voiceActiveRef.current && restartTimeoutRef.current == null) {
          restartBackoffRef.current = Math.min(6000, Math.round(restartBackoffRef.current * 1.25));
          queueRestart(Math.max(1200, restartBackoffRef.current));
        }
      };
      recognitionRef.current = rec;

      // Start recognition immediately after mount if voice is enabled.
      if (voiceActiveRef.current) {
        try {
          isStartingRef.current = true;
          lastStartAttemptRef.current = Date.now();
          rec.start();
        } catch {
          isStartingRef.current = false;
        }
      }

      // Disabled watchdog - was causing restart loops
      // Voice recognition should be stable without forced restarts
      // if (watchdogRef.current == null) {
      //   watchdogRef.current = window.setInterval(() => {
      //     if (!voiceActiveRef.current || !recognitionRef.current) return;
      //     
      //     // Only restart if recognition has been inactive for more than 30 seconds
      //     const timeSinceLastResult = Date.now() - lastCmdRef.current.at;
      //     if (timeSinceLastResult > 30000 && isRecognizingRef.current) {
      //       try {
      //         console.log("[Voice] Inactivity restart...");
      //         recognitionRef.current.stop();
      //         // onend will handle the restart automatically
      //       } catch {}
      //     }
      //   }, 15000); // Check every 15 seconds instead of 10
      // }
    } else {
      setVoiceSupported(false);
    }
    return () => {
      if (restartTimeoutRef.current != null) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (watchdogRef.current != null) {
        window.clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, []);

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 150);
    } catch {}
  };

  const handleCommand = (t: string) => {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    
    const norm = t.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    
    // Debounce: Don't process commands too rapidly (min 500ms apart)
    if (timeSinceLastProcess < 500) {
      return;
    }
    
    lastProcessTimeRef.current = now;
    if (!norm) return;

    // Skip processing if it contains offensive words or is unclear
    if (norm.includes('bich') || norm.includes('bitch') || norm.includes('damn') || norm.includes('shit')) {
      console.log("[Voice] Skipping offensive/unclear command");
      return;
    }

    console.log("[Voice Debug] Heard:", norm);

    const says = (phrase: string | RegExp) => {
      if (phrase instanceof RegExp) return phrase.test(norm);
      return norm.includes(phrase);
    };

    const exec = (fn: () => void) => {
      fn();
      // Keep recognition continuous; forced stop/start causes abort storms.
    };

    if (t.includes("stop listening") || t.includes("disable voice") || t.includes("turn off voice")) {
      if (voiceActive) toggleVoice();
      return;
    }

    // Wake Word Detection - ONLY with "hey" prefix to prevent unwanted triggers
    const wakeRegex = /^hey\s+friday\b/i;
    const directQueryRegex = /^friday\b/i;

    console.log("[Voice Debug] Processing:", norm);
    console.log("[Voice Debug] Wake regex test:", wakeRegex.test(norm));
    console.log("[Voice Debug] Direct query regex test:", directQueryRegex.test(norm));

    let finalCommandText = norm;
    let isExplicitQuery = false;

    // Check wake word FIRST (with "hey" prefix)
    if (wakeRegex.test(norm)) {
      console.log("[Voice Debug] Wake word matched!");
      const query = norm.replace(wakeRegex, "").trim();
      
      if (!query) {
        // Just the wake word: Open chat and speak greeting
        exec(() => {
          setChatOpen(true);
          speak("Ye buddy, how can I help you?");
        });
        return;
      }
      // If there's a query after "Hey CogniSense", treat that query as the new command
      finalCommandText = query;
      isExplicitQuery = true;
    } else if (directQueryRegex.test(norm)) {
      console.log("[Voice Debug] Direct query matched!");
      // Direct query for chatbot (without "hey")
      exec(() => {
        setChatOpen(true);
        void speak("Ok buddy, processing that.").then(() => {
          window.dispatchEvent(new CustomEvent("cognisense-voice-query", { detail: norm }));
        });
      });
      return;
    }

    // Now check the finalCommandText for navigation or other commands
    const cmd = finalCommandText;
    const saysCmd = (phrase: string | RegExp) => {
      if (phrase instanceof RegExp) return phrase.test(cmd);
      return cmd.includes(phrase);
    };

    if (cmd.includes("stop listening") || cmd.includes("disable voice") || cmd.includes("turn off voice")) {
      if (voiceActive) toggleVoice();
      return;
    }

    // PRIORITY NAVIGATION COMMANDS
    if (saysCmd("dashboard") || saysCmd("home") || saysCmd(/go .*home/) || saysCmd(/open .*dashboard/) || saysCmd("main page")) {
      exec(() => navigate("/"));
      return;
    }
    if (saysCmd("fatigue recon") || saysCmd("recon") || saysCmd("fatigue reconstruction") || saysCmd("open fatigue") || saysCmd(/open .*fatigue/)) {
      exec(() => navigate("/fatigue-recon"));
      return;
    }
    if (saysCmd("cognitive load") || saysCmd("load details") || saysCmd("full load") || saysCmd(/show .*load/)) {
      exec(() => navigate("/cognitive-load"));
      return;
    }
    if (saysCmd("team clusters") || saysCmd("clusters") || saysCmd("open team") || saysCmd("open teams") || saysCmd(/open .*clusters/)) {
      exec(() => navigate("/team-clusters"));
      return;
    }
    if (saysCmd("privacy guard") || saysCmd("privacy") || saysCmd(/open .*privacy/)) {
      exec(() => navigate("/privacy-guard"));
      return;
    }
    if (saysCmd("load planner") || saysCmd("planner") || saysCmd("open load") || saysCmd("open workload") || saysCmd(/open .*planner/)) {
      exec(() => navigate("/load-planner"));
      return;
    }
    if (saysCmd("settings") || saysCmd("preferences") || saysCmd(/open .*settings/)) {
      exec(() => navigate("/settings"));
      return;
    }
    if (saysCmd("profile") || saysCmd("user profile") || saysCmd(/open .*profile/)) {
      exec(() => navigate("/profile"));
      return;
    }
    if (saysCmd("notifications") || saysCmd("show alerts") || saysCmd(/show .*notifications/)) {
      exec(() => document.querySelector('[data-notification-toggle]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      return;
    }
    if (saysCmd("search") || saysCmd("command") || saysCmd(/open .*command/)) {
      exec(() => setSearchOpen(true));
      return;
    }

    if (saysCmd("show burnout") || saysCmd("burnout data") || saysCmd("burnout") || saysCmd(/show me .*burnout/)) {
      exec(() => {
        navigate("/");
        setTimeout(() => {
          document.getElementById("burnout-forecast")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      });
      return;
    }

    if (saysCmd("login") || saysCmd(/open .*login/)) {
      exec(() => navigate("/login"));
      return;
    }
    if (saysCmd("sign up") || saysCmd("signup") || saysCmd("register") || saysCmd(/open .*signup/)) {
      exec(() => navigate("/signup"));
      return;
    }
    if (saysCmd("logout") || saysCmd("log out")) {
      exec(() => {
        logout();
        navigate("/login");
      });
      return;
    }

    if (location.pathname === "/login") {
      if (saysCmd("email") || saysCmd("mail")) {
        const value = extractValue(cmd, ["email", "mail"]);
        if (value) exec(() => setFieldValue("email", value));
        return;
      }
      if (saysCmd("password")) {
        const value = extractValue(cmd, ["password"]);
        if (value) exec(() => setFieldValue("password", value));
        return;
      }
      if (saysCmd("submit") || saysCmd("log in") || saysCmd("login")) {
        exec(() => submitForm());
        return;
      }
    }

    // SCROLL COMMANDS
    if (saysCmd("scroll down") || cmd === "down" || saysCmd("page down") || cmd === "next") {
      exec(() => window.scrollBy({ top: 800, behavior: "smooth" }));
      return;
    }
    if (saysCmd("scroll up") || cmd === "up" || saysCmd("page up") || saysCmd("previous")) {
      exec(() => window.scrollBy({ top: -800, behavior: "smooth" }));
      return;
    }

    // If it was an explicit "Hey CogniSense [query]" but didn't match navigation, send to chatbot
    if (isExplicitQuery && cmd.length > 2) {
      exec(() => {
        setChatOpen(true);
        void speak("Ok buddy, processing that.").then(() => {
          window.dispatchEvent(new CustomEvent("cognisense-voice-query", { detail: cmd }));
        });
      });
      return;
    }
  };

  const toggleVoice = (manual: boolean = true) => {
    if (!voiceSupported || !recognitionRef.current) return;
    if (!voiceActive) {
      try {
        manualStopRef.current = false;
        voiceActiveRef.current = true;
        restartBackoffRef.current = 900;
        isStartingRef.current = true;
        lastStartAttemptRef.current = Date.now();
        recognitionRef.current.start();
        setVoiceActive(true);
        localStorage.setItem("voiceActive", "true");
        if (manual) speak("Voice control on");
      } catch {
        isStartingRef.current = false;
      }
    } else {
      try {
        manualStopRef.current = true;
        voiceActiveRef.current = false;
        isStartingRef.current = false;
        if (restartTimeoutRef.current != null) {
          window.clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        recognitionRef.current.stop();
        setVoiceActive(false);
        localStorage.setItem("voiceActive", "false");
        if (manual) speak("Voice control off");
      } catch {}
    }
  };

  return (
    <div className={`flex min-h-screen ${ambience === "relaxing" ? "bg-transparent" : "bg-background"}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <DashboardSidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="border-b border-border/70 bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider overflow-hidden">
          <div className="animate-friday-marquee whitespace-nowrap py-1.5 w-max">
            <span className="px-6">FriDaY Voice Assistant is live - say "Hey Friday" to ask anything</span>
            <span className="px-6">Say "Friday, tell me about models" for instant answers</span>
            <span className="px-6">Use voice commands to navigate pages and open features</span>
            <span className="px-6">FriDaY Voice Assistant is live - say "Hey Friday" to ask anything</span>
            <span className="px-6">Say "Friday, tell me about models" for instant answers</span>
            <span className="px-6">Use voice commands to navigate pages and open features</span>
          </div>
        </div>
        <header className="border-b border-border px-4 py-2 flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent md:hidden text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showMetrics && (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              <div className="min-w-[200px] flex-1">
                <CognitiveEnergyMeter />
              </div>
              <div className="hidden lg:block min-w-[240px]">
                <RadialGauge />
              </div>
            </div>
          )}
          {!showMetrics && <div className="flex-1" />}
          
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="hidden sm:block w-32 md:w-36">
              <Select value={ambience} onValueChange={(v: "simple" | "relaxing") => setAmbience(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="relaxing">Relaxing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:block w-24 md:w-28">
              <Select value={theme} onValueChange={(v: "dark" | "light") => setTheme(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => toggleVoice(true)}
              disabled={!voiceSupported}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {voiceActive ? <Mic className="w-4 h-4 text-primary" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                const next = !bgAudioEnabled;
                setBgAudioEnabled(next);
                try { localStorage.setItem("bgAudioEnabled", String(next)); } catch { return; }
                const v = document.getElementById("global-bg-video") as HTMLVideoElement | null;
                if (v) {
                  v.muted = !next;
                  v.play().catch(() => {});
                }
              }}
              disabled={ambience === "simple"}
              className={`hidden md:flex px-2 h-8 rounded-lg bg-accent items-center justify-center transition-colors ${ambience === "simple" ? "opacity-50 cursor-not-allowed" : bgAudioEnabled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className="text-[11px]">BG Audio</span>
            </button>
            <button
              onClick={() => {
                const v = document.getElementById("global-bg-video") as HTMLVideoElement | null;
                if (!v) return;
                const next = !bgPaused;
                setBgPaused(next);
                try { localStorage.setItem("bgPaused", String(next)); } catch { return; }
                if (next) {
                  v.pause();
                } else {
                  v.play().catch(() => {});
                }
              }}
              disabled={ambience === "simple"}
              className={`px-2 h-8 rounded-lg bg-accent flex items-center justify-center transition-colors ${ambience === "simple" ? "opacity-50 cursor-not-allowed" : bgPaused ? "text-muted-foreground hover:text-foreground" : "text-primary"}`}
            >
              {bgPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <NotificationCenter />
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto space-y-4">
            {children}
        </main>
        <Footer pageType={
          location.pathname === '/' ? 'dashboard' :
          location.pathname === '/cognitive-load' ? 'cognitive' :
          location.pathname === '/fatigue-recon' ? 'fatigue' :
          location.pathname === '/team-clusters' ? 'clusters' :
          location.pathname === '/privacy-guard' ? 'privacy' :
          location.pathname === '/load-planner' ? 'loadplanner' :
          location.pathname === '/settings' ? 'settings' : 'dashboard'
        } />
        <Chatbot forceOpen={chatOpen} onOpenChange={setChatOpen} />
        </div>

      <Dialog open={teamSelectOpen} onOpenChange={setTeamSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Select your team</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {(teamsBySector[(user?.sector || "general") as 'academic' | 'industrial' | 'general'] || []).map((t) => (
              <button
                key={t.id}
                onClick={() => { updateUser({ teamId: t.id }); setTeamSelectOpen(false); }}
                className="p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors text-left"
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{user?.sector} sector</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => { updateUser({ teamId: "unassigned" }); setTeamSelectOpen(false); }}>
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages, teams, widgets..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {["Pages", "Widgets", "Teams"].map((group) => (
            <CommandGroup key={group} heading={group}>
              {searchItems
                .filter((i) => i.group === group)
                .map((item) => (
                  <CommandItem
                    key={item.label}
                    onSelect={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
}
interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList;
  resultIndex: number;
}
interface ISpeechRecognitionResultList {
  length: number;
  item: (index: number) => { transcript: string };
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item: (index: number) => { transcript: string };
  [index: number]: { transcript: string };
}

function extractValue(t: string, keys: string[]) {
  for (const k of keys) {
    const idx = t.indexOf(k);
    if (idx >= 0) {
      const after = t.slice(idx + k.length).trim();
      const cleaned = after.replace(/^(is|=|:)\s*/, "");
      if (cleaned) return cleaned;
    }
  }
  return "";
}

function extractRole(t: string) {
  if (t.includes("admin")) return "admin";
  if (t.includes("academic")) return "academic";
  if (t.includes("user") || t.includes("individual")) return "user";
  return "";
}

function setFieldValue(id: string, value: string) {
  const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!input) return;
  const nativeSetter = Object.getOwnPropertyDescriptor((window as any).HTMLInputElement.prototype, "value")?.set;
  if (nativeSetter) nativeSetter.call(input, value);
  else (input as any).value = value;
  const e = new Event("input", { bubbles: true });
  input.dispatchEvent(e);
}

function setRoleRadio(role: string) {
  const id = role === "admin" ? "admin" : role === "academic" ? "academic" : "user";
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.click();
  }
}

function submitForm() {
  const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
  if (btn) btn.click();
}
