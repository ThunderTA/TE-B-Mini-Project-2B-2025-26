import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "academic" | "industrial" | "government";
type Profile = "manager" | "individual";
type Ambience = "simple" | "relaxing";
type Theme = "dark" | "light";

export type TaskItem = { task: string; team: string; duration: number; preferredHour: number; cost: number };

interface ViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  ambience: Ambience;
  setAmbience: (a: Ambience) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  tasks: TaskItem[];
  setTasks: (tasks: TaskItem[]) => void;
}

const ViewContext = createContext<ViewContextType | null>(null);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasksState] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("plannerTasks");
    return saved ? JSON.parse(saved) : [
      { task: "Code Review", team: "Eng-A", duration: 60, preferredHour: 11, cost: 45 },
      { task: "Design Sync", team: "Design", duration: 45, preferredHour: 15, cost: 30 },
      { task: "QA Regression", team: "QA", duration: 90, preferredHour: 10, cost: 65 },
    ];
  });

  const setTasks = (t: TaskItem[]) => {
    setTasksState(t);
    localStorage.setItem("plannerTasks", JSON.stringify(t));
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("viewMode");
    if (saved === "academic" || saved === "industrial" || saved === "government") return saved;
    return "academic";
  });
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem("profile");
    if (saved === "manager" || saved === "individual") return saved;
    return "manager";
  });
  const [ambience, setAmbienceState] = useState<Ambience>(() => {
    const saved = localStorage.getItem("ambience");
    if (saved === "simple" || saved === "relaxing") return saved as Ambience;
    return "relaxing";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved as Theme;
    return "dark";
  });

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
  };
  const setProf = (p: Profile) => {
    setProfile(p);
    localStorage.setItem("profile", p);
  };
  const setAmb = (a: Ambience) => {
    setAmbienceState(a);
    localStorage.setItem("ambience", a);
  };
  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  return (
    <ViewContext.Provider value={{ 
      viewMode, setViewMode: setMode, 
      profile, setProfile: setProf, 
      ambience, setAmbience: setAmb, 
      theme, setTheme,
      tasks, setTasks
    }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within ViewProvider");
  return ctx;
}
