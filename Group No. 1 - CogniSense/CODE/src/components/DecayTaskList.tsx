import { Clock, BrainCircuit, Zap } from "lucide-react";

const tasks = [
  { id: 1, name: "Review ML Pipeline", cost: 92, decay: 0.045, status: "critical", time: "2.5h" },
  { id: 2, name: "Sprint Planning", cost: 78, decay: 0.038, status: "warning", time: "1.5h" },
  { id: 3, name: "Code Review: Auth Module", cost: 65, decay: 0.028, status: "warning", time: "1h" },
  { id: 4, name: "Documentation Update", cost: 35, decay: 0.015, status: "stable", time: "45m" },
  { id: 5, name: "Team Standup", cost: 22, decay: 0.008, status: "stable", time: "15m" },
  { id: 6, name: "Email Triage", cost: 18, decay: 0.006, status: "stable", time: "20m" },
];

function getStatusStyles(status: string) {
  if (status === "critical") return { bar: "bg-destructive", text: "text-destructive" };
  if (status === "warning") return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

export default function DecayTaskList() {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Adaptive Schedule</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tasks by Cognitive Cost</p>
        </div>
        <button className="px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
          Auto-Distribute
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task, i) => {
          const styles = getStatusStyles(task.status);
          return (
            <div
              key={task.id}
              className="group rounded-lg bg-muted/30 border border-border/50 p-3 hover:border-primary/15 transition-all cursor-pointer"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{task.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {task.time}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${styles.bar} transition-all`}
                    style={{ width: `${task.cost}%` }}
                  />
                </div>
                <span className={`text-[11px] font-mono font-semibold ${styles.text}`}>
                  {task.cost}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <BrainCircuit className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono">
                  λ = {task.decay}/hr
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
