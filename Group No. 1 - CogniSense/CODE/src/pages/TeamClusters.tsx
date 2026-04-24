import DashboardLayout from "@/components/DashboardLayout";
import { useView } from "@/contexts/ViewContext";
import { Shield, Users, AlertTriangle, Network } from "lucide-react";

const viewTeams: Record<string, any[]> = {
  academic: [
    { name: "ML Lab", members: 8, risk: 0.9, load: 88, lead: "Prof. Chen", status: "critical" },
    { name: "NLP Group", members: 6, risk: 0.45, load: 58, lead: "Dr. Patel", status: "moderate" },
    { name: "CV Research", members: 5, risk: 0.8, load: 82, lead: "Dr. Zhang", status: "critical" },
    { name: "Stats Dept", members: 7, risk: 0.15, load: 35, lead: "Prof. Singh", status: "stable" },
    { name: "Bio-Info", members: 4, risk: 0.65, load: 71, lead: "Dr. Moreau", status: "warning" },
    { name: "HCI Lab", members: 6, risk: 0.3, load: 48, lead: "Prof. Kim", status: "stable" },
    { name: "Robotics", members: 3, risk: 0.72, load: 76, lead: "Dr. Petrov", status: "warning" },
    { name: "Ethics", members: 4, risk: 0.1, load: 28, lead: "Prof. Okafor", status: "stable" },
    { name: "Admin", members: 5, risk: 0.55, load: 64, lead: "Dean Rivera", status: "moderate" },
    { name: "Library", members: 6, risk: 0.2, load: 38, lead: "Ms. Lee", status: "stable" },
    { name: "Grad TAs", members: 12, risk: 0.62, load: 70, lead: "Dr. Brown", status: "warning" },
    { name: "Post-Docs", members: 8, risk: 0.35, load: 50, lead: "Dr. Torres", status: "stable" },
  ],
  industrial: [
    { name: "Eng-A", members: 8, risk: 0.2, load: 42, lead: "M. Torres", status: "stable" },
    { name: "Eng-B", members: 6, risk: 0.45, load: 58, lead: "K. Patel", status: "moderate" },
    { name: "Design", members: 5, risk: 0.8, load: 82, lead: "L. Zhang", status: "critical" },
    { name: "Ops", members: 7, risk: 0.15, load: 35, lead: "R. Singh", status: "stable" },
    { name: "Research", members: 4, risk: 0.65, load: 71, lead: "A. Moreau", status: "warning" },
    { name: "QA", members: 6, risk: 0.3, load: 48, lead: "J. Kim", status: "stable" },
    { name: "ML-Ops", members: 3, risk: 0.9, load: 88, lead: "S. Chen", status: "critical" },
    { name: "DevRel", members: 4, risk: 0.1, load: 28, lead: "T. Okafor", status: "stable" },
    { name: "PM", members: 5, risk: 0.55, load: 64, lead: "N. Rivera", status: "moderate" },
    { name: "Data", members: 6, risk: 0.35, load: 50, lead: "C. Lee", status: "stable" },
    { name: "Infra", members: 4, risk: 0.72, load: 76, lead: "V. Petrov", status: "warning" },
    { name: "Sales", members: 8, risk: 0.25, load: 40, lead: "D. Brown", status: "stable" },
  ],
  government: [
    { name: "Policy", members: 10, risk: 0.35, load: 52, lead: "Dir. Adams", status: "stable" },
    { name: "IT Ops", members: 6, risk: 0.7, load: 78, lead: "Mgr. Chen", status: "warning" },
    { name: "Legal", members: 8, risk: 0.55, load: 65, lead: "AG Williams", status: "moderate" },
    { name: "HR", members: 5, risk: 0.2, load: 38, lead: "Dir. Patel", status: "stable" },
    { name: "Finance", members: 7, risk: 0.82, load: 85, lead: "CFO Singh", status: "critical" },
    { name: "Public Affairs", members: 4, risk: 0.4, load: 55, lead: "Mgr. Kim", status: "moderate" },
    { name: "Health Svc", members: 9, risk: 0.88, load: 90, lead: "Dr. Zhang", status: "critical" },
    { name: "Education", members: 6, risk: 0.3, load: 45, lead: "Dir. Brown", status: "stable" },
    { name: "Transport", members: 5, risk: 0.48, load: 60, lead: "Mgr. Torres", status: "moderate" },
    { name: "Security", members: 8, risk: 0.6, load: 68, lead: "Chief Lee", status: "warning" },
    { name: "Compliance", members: 4, risk: 0.15, load: 32, lead: "Mgr. Okafor", status: "stable" },
    { name: "Comms", members: 3, risk: 0.25, load: 42, lead: "Dir. Rivera", status: "stable" },
  ],
};

function getStatusStyles(status: string) {
  if (status === "critical") return { bg: "bg-destructive/15", border: "border-destructive/30", badge: "bg-destructive/20 text-destructive", dot: "bg-destructive" };
  if (status === "warning") return { bg: "bg-warning/10", border: "border-warning/25", badge: "bg-warning/20 text-warning", dot: "bg-warning" };
  if (status === "moderate") return { bg: "bg-warning/5", border: "border-warning/15", badge: "bg-warning/15 text-warning", dot: "bg-warning" };
  return { bg: "bg-success/5", border: "border-success/15", badge: "bg-success/20 text-success", dot: "bg-success" };
}

export default function TeamClusters() {
  const { viewMode } = useView();
  const teams = viewTeams[viewMode];
  const criticalCount = teams.filter((t: any) => t.status === "critical").length;
  const warningCount = teams.filter((t: any) => t.status === "warning" || t.status === "moderate").length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Team Clusters</h2>
          <p className="text-xs text-muted-foreground">K-Means cluster analysis · <span className="capitalize">{viewMode}</span> view</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Anonymized</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="glass-card p-3 animate-fade-in">
          <p className="text-[11px] text-muted-foreground">Total Teams</p>
          <p className="text-xl font-bold font-mono text-primary mt-0.5">{teams.length}</p>
        </div>
        <div className="glass-card p-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-[11px] text-muted-foreground">Total Members</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{teams.reduce((s: number, t: any) => s + t.members, 0)}</p>
        </div>
        <div className="glass-card p-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-[11px] text-muted-foreground">Critical Clusters</p>
          <p className="text-xl font-bold font-mono text-destructive mt-0.5">{criticalCount}</p>
        </div>
        <div className="glass-card p-3 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <p className="text-[11px] text-muted-foreground">At-Risk Clusters</p>
          <p className="text-xl font-bold font-mono text-warning mt-0.5">{warningCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {teams.map((team: any, i: number) => {
          const s = getStatusStyles(team.status);
          return (
            <div key={team.name} className={`glass-card-hover p-3 ${s.border} border animate-fade-in`} style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <h4 className="text-sm font-semibold text-foreground">{team.name}</h4>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.badge} capitalize`}>{team.status}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Burnout Risk</span>
                  <span className="font-mono text-foreground">{Math.round(team.risk * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${team.risk >= 0.7 ? "bg-destructive" : team.risk >= 0.4 ? "bg-warning" : "bg-success"}`} style={{ width: `${team.risk * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Load</span>
                  <span className="font-mono text-foreground">{team.load}%</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{team.members}</span>
                  <span className="text-[11px] text-muted-foreground">{team.lead}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
