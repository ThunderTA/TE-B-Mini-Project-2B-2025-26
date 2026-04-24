import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useView } from "@/contexts/ViewContext";
import {
  LayoutDashboard,
  Users,
  Activity,
  Shield,
  Settings,
  ChevronDown,
  GraduationCap,
  Building2,
  Landmark,
  User,
  UserCog,
} from "lucide-react";

const viewModes = [
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "industrial", label: "Industrial", icon: Building2 },
  { id: "government", label: "General / Gov", icon: Landmark },
] as const;

const profiles = [
  { id: "manager", label: "Manager / Admin", icon: UserCog },
  { id: "individual", label: "Individual / User", icon: User },
] as const;

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Activity, label: "Cognitive Load", path: "/cognitive-load" },
  { icon: Activity, label: "Fatigue Recon", path: "/fatigue-recon" },
  { icon: Users, label: "Team Clusters", path: "/team-clusters" },
  { icon: Shield, label: "Privacy Guard", path: "/privacy-guard" },
  { icon: Activity, label: "Load Planner", path: "/load-planner" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { viewMode, setViewMode, profile, setProfile } = useView();
  const [viewOpen, setViewOpen] = useState(false);

  const currentView = viewModes.find((v) => v.id === viewMode)!;
  const currentProfile = profiles.find((p) => p.id === profile)!;

  return (
    <aside className="w-64 md:w-56 h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-2xl md:shadow-none">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-teal">
          <img src="/CS_LOGO.jpg" alt="CS Logo" className="w-7 h-7 rounded-lg object-cover" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">CogniSense™</h1>
          <p className="text-[10px] text-muted-foreground font-mono">ML-DRIVEN COGNITIVE</p>
        </div>
      </div>

      {/* Route Switcher */}
      <div className="px-2.5 pt-3 pb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 px-2">Context View</p>
        <div className="relative">
          <button
            onClick={() => setViewOpen(!viewOpen)}
            className="w-full glass-card px-2.5 py-2 flex items-center justify-between text-sm text-foreground hover:border-primary/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <currentView.icon className="w-4 h-4 text-primary" />
              {currentView.label}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${viewOpen ? "rotate-180" : ""}`} />
          </button>
          {viewOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-border z-50 py-1 animate-scale-in">
              {viewModes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setViewMode(v.id); setViewOpen(false); }}
                  className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm transition-colors ${
                    v.id === viewMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <v.icon className="w-4 h-4" />
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Toggle */}
      <div className="px-2.5 pb-2">
        <div className="flex gap-1 p-0.5 glass-card">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfile(p.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                p.id === profile
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <p.icon className="w-3.5 h-3.5" />
              {p.id === "manager" ? "Admin" : "User"}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-1.5 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status */}
      <div className="p-2.5 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/profile")}
          className="w-full glass-card px-2.5 py-2 flex items-center gap-2.5 hover:border-primary/20 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <currentProfile.icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-foreground truncate">Tushar Zaware</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-medium">
              {currentView.label} · {currentProfile.label}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
        </button>
      </div>
    </aside>
  );
}
