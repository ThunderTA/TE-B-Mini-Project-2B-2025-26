import DashboardLayout from "@/components/DashboardLayout";
import { useView } from "@/contexts/ViewContext";
import { User, Mail, Building2, Calendar, Target, Award, Clock, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const viewProfiles: Record<string, { name: string; role: string; email: string; team: string; joined: string; weekly: { day: string; load: number }[] }> = {
  academic: {
    name: "Tushar Zaware", role: "Lead Cognitive Researcher", email: "tushar@cognisense.ai", team: "AI Research Lab", joined: "Jan 2024",
    weekly: [{ day: "Mon", load: 65 }, { day: "Tue", load: 72 }, { day: "Wed", load: 58 }, { day: "Thu", load: 80 }, { day: "Fri", load: 45 }],
  },
  industrial: {
    name: "Tushar Zaware", role: "Industrial Lead", email: "tushar@cognisense.ai", team: "Operations", joined: "Jan 2024",
    weekly: [{ day: "Mon", load: 55 }, { day: "Tue", load: 78 }, { day: "Wed", load: 82 }, { day: "Thu", load: 70 }, { day: "Fri", load: 48 }],
  },
  government: {
    name: "Tushar Zaware", role: "Government Policy Lead", email: "tushar@cognisense.ai", team: "Public Safety", joined: "Jan 2024",
    weekly: [{ day: "Mon", load: 42 }, { day: "Tue", load: 55 }, { day: "Wed", load: 60 }, { day: "Thu", load: 52 }, { day: "Fri", load: 35 }],
  },
};

const achievements = [
  { label: "Deep Work Streak", value: "5 days", icon: Target },
  { label: "Recovery Compliance", value: "92%", icon: Award },
  { label: "Avg. Focus Time", value: "3.2h/day", icon: Clock },
  { label: "Load Efficiency", value: "+12%", icon: TrendingUp },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-border">
      <p className="font-medium text-foreground">{label}</p>
      <p className="font-mono text-primary">Load: {payload[0].value}%</p>
    </div>
  );
};

export default function UserProfile() {
  const { viewMode } = useView();
  const prof = viewProfiles[viewMode];

  return (
    <DashboardLayout>
      <div className="glass-card p-4 flex items-center gap-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center glow-teal">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{prof.name}</h2>
          <p className="text-xs text-muted-foreground">{prof.role}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{prof.email}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="w-3 h-3" />{prof.team}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{prof.joined}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Status</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-medium text-success">Online · In Focus</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.map((a, i) => (
          <div key={a.label} className="glass-card p-3 animate-fade-in" style={{ animationDelay: `${(i + 1) * 40}ms` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <a.icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-lg font-bold font-mono text-primary">{a.value}</p>
            <p className="text-[11px] text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 glass-card p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Weekly Cognitive Load</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Personal load trend this week</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={prof.weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(170 100% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(170 100% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={{ stroke: "hsl(225 25% 18%)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="load" stroke="hsl(170 100% 45%)" fill="url(#weeklyGrad)" strokeWidth={2} dot={{ fill: "hsl(170 100% 45%)", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-5 glass-card p-4 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Cognitive Summary</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Today's assessment</p>
          <div className="space-y-2.5">
            {[
              { label: "Working Memory", value: 72, color: "primary" },
              { label: "Attention Span", value: 65, color: "warning" },
              { label: "Decision Quality", value: 80, color: "success" },
              { label: "Task Switching", value: 45, color: "destructive" },
              { label: "Creative Output", value: 70, color: "primary" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  <span className={`text-[11px] font-mono text-${m.color}`}>{m.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full bg-${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
