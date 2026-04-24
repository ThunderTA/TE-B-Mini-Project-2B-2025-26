import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { X, Play, Brain, Sparkles, Activity, TrendingUp, Clock, Info } from "lucide-react";
import { useView, TaskItem } from "@/contexts/ViewContext";

type SlotItem = { task: string; team: string; start: number; preferredHour: number; cost: number };
type Schedule = { slots: SlotItem[] } | null;

export default function LoadPlanner() {
  const { tasks, setTasks } = useView();
  const [newTask, setNewTask] = useState<TaskItem>({ task: "", team: "Eng-A", duration: 30, preferredHour: 9, cost: 20 });
  const [schedule, setSchedule] = useState<Schedule>(null);
  const [forecast, setForecast] = useState<{ t: number; v: number }[]>([]);
  const [recovery, setRecovery] = useState<{ recommended: boolean; minutes: number; probability: number } | null>(null);
  const [fatigueScore, setFatigueScore] = useState<number>(72);
  const [taskInsights, setTaskInsights] = useState<{ avgCost: number; totalDuration: number; complexity: string } | null>(null);
  const [realTimePredictions, setRealTimePredictions] = useState<any>(null);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const addTask = () => {
    if (!newTask.task) return;
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTask({ task: "", team: "Eng-A", duration: 30, preferredHour: 9, cost: 20 });
    updateTaskInsights(updatedTasks);
  };

  const updateTaskInsights = (currentTasks: TaskItem[]) => {
    if (currentTasks.length === 0) {
      setTaskInsights(null);
      return;
    }
    
    const avgCost = currentTasks.reduce((sum, task) => sum + task.cost, 0) / currentTasks.length;
    const totalDuration = currentTasks.reduce((sum, task) => sum + task.duration, 0);
    
    let complexity = "Low";
    if (avgCost > 60 || totalDuration > 240) complexity = "High";
    else if (avgCost > 40 || totalDuration > 120) complexity = "Medium";
    
    setTaskInsights({ avgCost, totalDuration, complexity });
  };

  useEffect(() => {
    updateTaskInsights(tasks);
  }, [tasks]);

  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch("http://localhost:8002/api/ga_optimize_schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      setSchedule(data as Schedule);
    } catch {
      // Fallback for demo
      setSchedule({
        slots: tasks.map((t, i) => ({ ...t, start: (9 + i) % 24 }))
      });
    }
    setIsOptimizing(false);
  };

  const runForecast = async () => {
    try {
      const res = await fetch("http://localhost:8002/api/lstm_forecast_with_tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      const items = Array.isArray(data?.series) ? data.series : [];
      setForecast(items.slice(0, 24));
    } catch (error) {
      // Fallback data
      const mockForecast = Array.from({ length: 24 }, (_, i) => ({
        t: i,
        v: 40 + Math.sin(i / 3) * 20 + (tasks.length * 2)
      }));
      setForecast(mockForecast);
    }
  };

  const runRecovery = async () => {
    try {
      const res = await fetch("http://localhost:8002/api/bayesian_recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fatigue: fatigueScore, tasks }),
      });
      const data = await res.json();
      setRecovery(data);
    } catch (error) {
      // Dynamic fallback based on tasks and fatigue
      const totalCost = tasks.reduce((s, t) => s + t.cost, 0);
      const calculatedMinutes = Math.round((fatigueScore / 100) * 30 + (totalCost / 200) * 30);
      setRecovery({
        recommended: true,
        minutes: Math.min(60, Math.max(15, calculatedMinutes)),
        probability: 0.75 + (Math.random() * 0.2)
      });
    }
  };

  const generateRealTimePredictions = async () => {
    setIsGeneratingPredictions(true);
    try {
      const res = await fetch("http://localhost:8002/api/realtime_predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fatigue: fatigueScore, tasks }),
      });
      const data = await res.json();
      setRealTimePredictions(data);
    } catch (error) {
      // Mock data for predictions
      setRealTimePredictions({
        insights: {
          peak_fatigue_hour: 14,
          optimal_break_time: "15:30",
          high_risk_tasks: tasks.filter(t => t.cost > 50).length,
          total_workload: tasks.reduce((s, t) => s + t.duration, 0)
        },
        predictions: Array.from({ length: 4 }, (_, i) => ({
          hour: 9 + i,
          risk_level: i % 2 === 0 ? "Medium" : "Low",
          predicted_fatigue: 50 + i * 5
        }))
      });
    }
    setIsGeneratingPredictions(false);
  };

  const teamDistributionData = useMemo(() => {
    const dist: Record<string, number> = {};
    tasks.forEach(t => {
      dist[t.team] = (dist[t.team] || 0) + t.duration;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Team Load Planner</h2>
          <p className="text-xs text-muted-foreground">Inputs for predictions, scheduling, and recovery planning</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-12 lg:col-span-6 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Tasks & Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Task Name</span>
                <Input
                  placeholder="Task"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Team</span>
                <Select value={newTask.team} onValueChange={(v) => setNewTask({ ...newTask, team: v })}>
                  <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Eng-A","Eng-B","Design","Ops","Research","QA","ML-Ops","DevRel","PM","Data","Infra","Sales"].map((t) => (
                      <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Duration (m)</span>
                <Input
                  type="number"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value || "0") })}
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Preferred Hr</span>
                <Input
                  type="number"
                  value={newTask.preferredHour}
                  onChange={(e) => setNewTask({ ...newTask, preferredHour: parseInt(e.target.value || "9") })}
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Cog. Cost</span>
                <Input
                  type="number"
                  value={newTask.cost}
                  onChange={(e) => setNewTask({ ...newTask, cost: parseInt(e.target.value || "0") })}
                  className="text-sm h-8"
                />
              </div>
            </div>
            <Button onClick={addTask} className="text-xs h-8 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 w-full">Add Task to Pipeline</Button>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
              {tasks.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 border border-border/50 rounded-lg group hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{t.task}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{t.team}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-primary">{t.cost}% Cost</div>
                      <div className="text-[10px] text-muted-foreground">{t.duration}m @{t.preferredHour}:00</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={optimizeSchedule} disabled={isOptimizing} className="flex-1 text-sm h-9 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                {isOptimizing ? "Optimizing..." : "Optimize Schedule (Genetic Algorithm)"}
              </Button>
            </div>

            {schedule && schedule.slots && (
              <div className="mt-2 p-3 bg-muted/20 border border-border/30 rounded-lg space-y-2">
                <h4 className="text-xs font-bold flex items-center gap-2">
                  <Clock className="w-3 h-3 text-primary" />
                  Proposed Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {schedule.slots.map((s: SlotItem, i: number) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-background/50 rounded border border-border/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium">{s.task}</span>
                        <span className="text-[9px] text-muted-foreground">{s.team}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">{s.start}:00</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-6 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Forecast & AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={runForecast} size="sm" className="text-[11px] h-8 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Run LSTM Forecast
              </Button>
              <Button 
                onClick={generateRealTimePredictions} 
                disabled={isGeneratingPredictions}
                variant="outline"
                size="sm"
                className="text-[11px] h-8 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isGeneratingPredictions ? "Analyzing..." : "Real-time Analysis"}
              </Button>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                  <Input
                    type="number"
                    value={fatigueScore}
                    onChange={(e) => setFatigueScore(parseInt(e.target.value || "0"))}
                    className="text-xs w-12 h-6 p-1 bg-transparent border-none focus-visible:ring-0"
                  />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Fatigue</span>
                </div>
                <Button onClick={runRecovery} size="sm" className="text-[11px] h-8 flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30">
                  <Brain className="h-3.5 w-3.5" />
                  Plan Recovery
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="h-[180px] p-2 bg-muted/10 border border-border/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  24h Fatigue Forecast
                </p>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={forecast.length > 0 ? forecast : Array.from({length:24}, (_,i)=>({i,v:40+Math.sin(i/3)*20}))}>
                    <defs>
                      <linearGradient id="colorFatigue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(170 100% 45%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(170 100% 45%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" vertical={false} />
                    <XAxis dataKey="i" tick={{ fontSize: 8, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(217 32% 17%)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="v" stroke="hsl(170 100% 45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorFatigue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[180px] p-2 bg-muted/10 border border-border/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Team Workload Dist.
                </p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={teamDistributionData.length > 0 ? teamDistributionData : [{name:'Empty', value: 1}]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {teamDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {recovery && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Bayesian Recovery Recommendation</span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">{recovery.minutes} minutes</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Confidence Level:</span>
                  <span className="font-mono text-primary font-bold">{Math.round((recovery.probability || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: `${(recovery.probability || 0) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Recommendation adjusted for {taskInsights?.complexity.toLowerCase() || 'current'} task complexity.
                </p>
              </div>
            )}
            
            {realTimePredictions && (
              <div className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Cognitive Load Predictions</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase">Real-time</Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-background/40 p-2 rounded border border-border/20 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Peak Fatigue</p>
                    <p className="text-xs font-mono font-bold text-destructive">Hr {realTimePredictions.insights.peak_fatigue_hour}</p>
                  </div>
                  <div className="bg-background/40 p-2 rounded border border-border/20 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Optimal Break</p>
                    <p className="text-xs font-mono font-bold text-primary">{realTimePredictions.insights.optimal_break_time}</p>
                  </div>
                  <div className="bg-background/40 p-2 rounded border border-border/20 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">High Risk</p>
                    <p className="text-xs font-mono font-bold text-warning">{realTimePredictions.insights.high_risk_tasks}</p>
                  </div>
                  <div className="bg-background/40 p-2 rounded border border-border/20 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Total Load</p>
                    <p className="text-xs font-mono font-bold text-foreground">{realTimePredictions.insights.total_workload}m</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase px-1">Next 4 Hours Forecast</p>
                  {realTimePredictions.predictions.slice(0, 4).map((pred: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${pred.risk_level === 'High' ? 'bg-destructive' : pred.risk_level === 'Medium' ? 'bg-warning' : 'bg-success'}`} />
                        <span className="text-[10px] font-medium font-mono">Hour {pred.hour}:00</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold">{pred.predicted_fatigue}%</span>
                        <Badge className={`text-[9px] h-4 ${pred.risk_level === "High" ? "bg-destructive/10 text-destructive border-destructive/20" : pred.risk_level === "Medium" ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}`}>
                          {pred.risk_level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
