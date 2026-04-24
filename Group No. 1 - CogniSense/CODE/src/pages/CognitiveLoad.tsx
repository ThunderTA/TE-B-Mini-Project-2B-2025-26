import DashboardLayout from "@/components/DashboardLayout";
import { useView } from "@/contexts/ViewContext";
import { Brain, Activity, TrendingDown, Clock, Zap, RefreshCw, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from "recharts";

const viewData: Record<string, { hourly: { hour: string; load: number }[]; tasks: any[]; radar: any[]; metrics: any[] }> = {
  academic: {
    hourly: [
      { hour: "8AM", load: 35 }, { hour: "9AM", load: 52 }, { hour: "10AM", load: 78 },
      { hour: "11AM", load: 85 }, { hour: "12PM", load: 60 }, { hour: "1PM", load: 45 },
      { hour: "2PM", load: 72 }, { hour: "3PM", load: 80 }, { hour: "4PM", load: 68 },
      { hour: "5PM", load: 42 }, { hour: "6PM", load: 28 },
    ],
    tasks: [
      { task: "Thesis Review", intrinsic: 55, extraneous: 15, germane: 30 },
      { task: "Lab Meeting", intrinsic: 30, extraneous: 40, germane: 30 },
      { task: "Grant Writing", intrinsic: 70, extraneous: 10, germane: 20 },
      { task: "Data Analysis", intrinsic: 65, extraneous: 20, germane: 15 },
      { task: "Lecture Prep", intrinsic: 40, extraneous: 25, germane: 35 },
    ],
    radar: [
      { metric: "Working Memory", value: 72 }, { metric: "Attention", value: 65 },
      { metric: "Processing Speed", value: 80 }, { metric: "Task Switching", value: 45 },
      { metric: "Decision Fatigue", value: 58 }, { metric: "Creative Output", value: 70 },
    ],
    metrics: [
      { label: "Avg. Cognitive Load", value: "62.4%", icon: Brain, accent: "primary" },
      { label: "Peak Load Today", value: "85%", icon: Activity, accent: "destructive" },
      { label: "Decay Rate (λ)", value: "0.034/hr", icon: TrendingDown, accent: "warning" },
      { label: "Recovery ETA", value: "2.5h", icon: Clock, accent: "success" },
    ],
  },
  industrial: {
    hourly: [
      { hour: "6AM", load: 25 }, { hour: "7AM", load: 40 }, { hour: "8AM", load: 55 },
      { hour: "9AM", load: 72 }, { hour: "10AM", load: 88 }, { hour: "11AM", load: 90 },
      { hour: "12PM", load: 65 }, { hour: "1PM", load: 58 }, { hour: "2PM", load: 76 },
      { hour: "3PM", load: 82 }, { hour: "4PM", load: 70 }, { hour: "5PM", load: 45 },
    ],
    tasks: [
      { task: "Quality Inspection", intrinsic: 60, extraneous: 20, germane: 20 },
      { task: "Shift Handover", intrinsic: 25, extraneous: 45, germane: 30 },
      { task: "Equipment Calibration", intrinsic: 75, extraneous: 10, germane: 15 },
      { task: "Safety Audit", intrinsic: 50, extraneous: 30, germane: 20 },
      { task: "Production Report", intrinsic: 35, extraneous: 35, germane: 30 },
    ],
    radar: [
      { metric: "Reaction Time", value: 78 }, { metric: "Vigilance", value: 60 },
      { metric: "Motor Control", value: 85 }, { metric: "Task Switching", value: 55 },
      { metric: "Stress Response", value: 42 }, { metric: "Endurance", value: 68 },
    ],
    metrics: [
      { label: "Avg. Cognitive Load", value: "71.2%", icon: Brain, accent: "primary" },
      { label: "Peak Load Today", value: "90%", icon: Activity, accent: "destructive" },
      { label: "Decay Rate (λ)", value: "0.042/hr", icon: TrendingDown, accent: "warning" },
      { label: "Recovery ETA", value: "1.8h", icon: Clock, accent: "success" },
    ],
  },
  government: {
    hourly: [
      { hour: "9AM", load: 30 }, { hour: "10AM", load: 48 }, { hour: "11AM", load: 62 },
      { hour: "12PM", load: 55 }, { hour: "1PM", load: 38 }, { hour: "2PM", load: 50 },
      { hour: "3PM", load: 65 }, { hour: "4PM", load: 58 }, { hour: "5PM", load: 35 },
    ],
    tasks: [
      { task: "Policy Review", intrinsic: 45, extraneous: 30, germane: 25 },
      { task: "Citizen Inquiries", intrinsic: 30, extraneous: 45, germane: 25 },
      { task: "Report Filing", intrinsic: 55, extraneous: 25, germane: 20 },
      { task: "Inter-Agency Sync", intrinsic: 40, extraneous: 35, germane: 25 },
      { task: "Training Module", intrinsic: 25, extraneous: 20, germane: 55 },
    ],
    radar: [
      { metric: "Working Memory", value: 65 }, { metric: "Attention", value: 70 },
      { metric: "Processing Speed", value: 62 }, { metric: "Task Switching", value: 58 },
      { metric: "Decision Fatigue", value: 50 }, { metric: "Compliance Focus", value: 82 },
    ],
    metrics: [
      { label: "Avg. Cognitive Load", value: "49.8%", icon: Brain, accent: "primary" },
      { label: "Peak Load Today", value: "65%", icon: Activity, accent: "warning" },
      { label: "Decay Rate (λ)", value: "0.021/hr", icon: TrendingDown, accent: "success" },
      { label: "Recovery ETA", value: "3.1h", icon: Clock, accent: "success" },
    ],
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono" style={{ color: p.color }}>{p.dataKey}: {p.value}%</p>
      ))}
    </div>
  );
};

export default function CognitiveLoad() {
  const { viewMode } = useView();
  const data = viewData[viewMode] || viewData.academic;
  const [liveData, setLiveData] = useState(data.hourly);
  const [currentLoad, setCurrentLoad] = useState(0);
  const [fatigueData, setFatigueData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Connect to real-time cognitive energy websocket
    const ws = new WebSocket("ws://localhost:8000/ws/cognitive_energy");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentLoad(data.energyLevel);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    // Fetch fatigue predictions
    const fetchFatigueData = async () => {
      try {
        const response = await fetch("/api/predictions/fatigue");
        const result = await response.json();
        if (result.items) {
          setFatigueData(result.items.slice(0, 10)); // Get last 10 predictions
        }
      } catch (error) {
        console.error("Failed to fetch fatigue data:", error);
      }
    };

    fetchFatigueData();
    const interval = setInterval(fetchFatigueData, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch fresh data from all endpoints
      const [fatigueResponse] = await Promise.all([
        fetch("/api/predictions/fatigue"),
        fetch("/api/train") // Retrain models
      ]);

      const fatigueResult = await fatigueResponse.json();
      if (fatigueResult.items) {
        setFatigueData(fatigueResult.items.slice(0, 10));
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    const exportData = {
      viewMode,
      timestamp: new Date().toISOString(),
      currentLoad,
      hourlyData: liveData,
      fatiguePredictions: fatigueData,
      tasks: data.tasks,
      radar: data.radar,
      metrics: data.metrics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognitive-load-${viewMode}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cognitive Load Analysis</h2>
          <p className="text-xs text-muted-foreground">Real-time cognitive load monitoring · <span className="capitalize">{viewMode}</span> view</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Badge variant="secondary" className="text-xs">
            Live: {currentLoad}%
          </Badge>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {data.metrics.map((m) => (
          <Card key={m.label} className="glass-card animate-fade-in">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-8 h-8 rounded-lg bg-${m.accent}/15 flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 text-${m.accent}`} />
                </div>
                {m.label === "Avg. Cognitive Load" && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    Live
                  </Badge>
                )}
              </div>
              <p className={`text-lg font-bold font-mono text-${m.accent}`}>
                {m.label === "Avg. Cognitive Load" ? `${currentLoad}%` : m.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hourly Cognitive Load</h3>
              <p className="text-[11px] text-muted-foreground">Today's load pattern with real-time updates</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-medium text-primary">Live</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={liveData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(170 100% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(170 100% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={{ stroke: "hsl(225 25% 18%)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="load" stroke="hsl(170 100% 45%)" fill="url(#loadGradient)" strokeWidth={2} dot={{ fill: "hsl(170 100% 45%)", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-5 glass-card p-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Cognitive Profile</h3>
          <p className="text-[11px] text-muted-foreground mb-2">Multi-dimensional assessment</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={data.radar}>
              <PolarGrid stroke="hsl(225 25% 18%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "hsl(215 20% 55%)" }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar dataKey="value" stroke="hsl(170 100% 45%)" fill="hsl(170 100% 45%)" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fatigue Predictions */}
      {fatigueData.length > 0 && (
        <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fatigue Predictions</h3>
              <p className="text-[11px] text-muted-foreground">ML-based mental fatigue forecasts from fatigueset</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={fatigueData.map((item, index) => ({ 
              index: index + 1, 
              fatigue: item.mentalFatiguePred || 0 
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={{ stroke: "hsl(225 25% 18%)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="fatigue" stroke="hsl(348 75% 60%)" strokeWidth={2} dot={{ fill: "hsl(348 75% 60%)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Cognitive Load Decomposition</h3>
            <p className="text-[11px] text-muted-foreground">Intrinsic · Extraneous · Germane load per task</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground">Intrinsic</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-warning" /><span className="text-[10px] text-muted-foreground">Extraneous</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-success" /><span className="text-[10px] text-muted-foreground">Germane</span></span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.tasks} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <YAxis type="category" dataKey="task" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="intrinsic" stackId="a" fill="hsl(170 100% 45%)" />
            <Bar dataKey="extraneous" stackId="a" fill="hsl(38 90% 55%)" />
            <Bar dataKey="germane" stackId="a" fill="hsl(155 70% 45%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
}
