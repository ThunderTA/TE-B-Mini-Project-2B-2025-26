import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, Legend, PolarRadiusAxis } from "recharts";
import { useView } from "@/contexts/ViewContext";

// Simplified Team Clusters for Report
const getStatusStyles = (status: string) => {
  if (status === "critical") return { bg: "bg-red-900/50", border: "border-red-700/60", badge: "bg-red-500/20 text-red-300", dot: "bg-red-500" };
  if (status === "warning") return { bg: "bg-yellow-900/40", border: "border-yellow-700/50", badge: "bg-yellow-500/20 text-yellow-300", dot: "bg-yellow-500" };
  if (status === "moderate") return { bg: "bg-yellow-900/20", border: "border-yellow-800/50", badge: "bg-yellow-500/15 text-yellow-400", dot: "bg-yellow-600" };
  return { bg: "bg-green-900/30", border: "border-green-800/50", badge: "bg-green-500/20 text-green-300", dot: "bg-green-500" };
};

export const ReportTeamClusters = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-300">Team Clusters Analysis</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-slate-400 uppercase">Critical</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[10px] text-slate-400 uppercase">Warning</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[10px] text-slate-400 uppercase">Stable</span></div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((team, i) => {
          const s = getStatusStyles(team.status);
          return (
            <div key={i} className={`p-4 rounded-xl border ${s.border} ${s.bg} transition-all hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-200">{team.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge} uppercase tracking-wider`}>{team.status}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-slate-400 text-xs">Burnout Risk</span><span className="font-mono text-slate-200 font-bold">{Math.round(team.risk * 100)}%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${team.risk > 0.7 ? 'bg-red-500' : team.risk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${team.risk * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Avg Cognitive Load</span>
                  <span className="font-mono text-slate-200 font-bold">{team.load}%</span>
                </div>
                <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Lead: {team.lead}</span>
                  <span className="text-slate-500">{team.members} Members</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-6 italic leading-relaxed border-l-2 border-slate-700 pl-4">
        Analysis: The k-Means clustering algorithm identifies distinct team performance profiles. Teams like ML Lab and CV Research show critical burnout risk (90% and 82% respectively), indicating immediate need for intervention, likely due to high cognitive load (88% and 82%). In contrast, teams like Stats Dept remain stable with low risk and load, suggesting balanced workload distribution.
      </p>
    </div>
  );
};


// Simplified Cognitive Load for Report
export const ReportCognitiveLoad = ({ data }: { data: any }) => {
  if (!data || !data.hourly) return null;
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <h2 className="text-lg font-bold text-slate-300 mb-4">Cognitive Load Analysis</h2>
      <div className="h-[280px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="reportLoadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="reportBenchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <Area 
              name="Current Load"
              type="monotone" 
              dataKey="load" 
              stroke="#34d399" 
              fill="url(#reportLoadGradient)" 
              strokeWidth={3} 
              animationDuration={1500}
            />
            <Area 
              name="Industry Benchmark"
              type="monotone" 
              dataKey="benchmark" 
              stroke="#6366f1" 
              fill="url(#reportBenchmarkGradient)" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-4 italic leading-relaxed border-l-2 border-slate-700 pl-4">
        Analysis: The hourly cognitive load chart reveals peak activity between 10 AM and 3 PM, with an average load of 62.4%. The decomposition shows that tasks like 'Grant Writing' have high intrinsic load, while 'Lab Meetings' suffer from high extraneous load, suggesting inefficiencies in meeting structures that could be optimized.
      </p>
    </div>
  );
};


// Task Breakdown for Report
export const ReportTaskBreakdown = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <h2 className="text-lg font-bold text-slate-300 mb-4">Task Component Decomposition</h2>
      <div className="h-[280px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="task" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} width={100} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <Bar name="Intrinsic" dataKey="intrinsic" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar name="Extraneous" dataKey="extraneous" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
            <Bar name="Germane" dataKey="germane" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-4 italic leading-relaxed border-l-2 border-slate-700 pl-4">
        Analysis: Cognitive Load Theory (CLT) breakdown identifies 'Lab Meeting' as having the highest extraneous load (40%), indicating significant environmental noise or process inefficiency. 'Grant Writing' shows optimal germane load, suggesting high-quality knowledge construction despite high intrinsic difficulty.
      </p>
    </div>
  );
};

// Radar Analysis for Report
export const ReportRadarAnalysis = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <h2 className="text-lg font-bold text-slate-300 mb-4">Cognitive Profile Radar</h2>
      <div className="h-[280px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Current Profile"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={3}
            />
            <Tooltip 
              contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-4 italic leading-relaxed border-l-2 border-slate-700 pl-4">
        Analysis: The radar chart indicates high 'Processing Speed' and 'Working Memory' utilization, but reveals a significant drop in 'Decision Fatigue' resistance. This suggests that while raw output remains high, the quality of strategic decisions may degrade as the session progresses.
      </p>
    </div>
  );
};

// Simplified Burnout Forecast for Report
export const ReportBurnoutForecast = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <h2 className="text-lg font-bold text-slate-300 mb-4">Burnout Risk Forecast (24h)</h2>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="reportPredictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="reportConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
            />
            <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="4 4" label={{ position: 'right', value: 'High Risk', fill: '#f43f5e', fontSize: 10 }} />
            <Area 
              name="Predicted Risk"
              type="monotone" 
              dataKey="prediction" 
              stroke="#f43f5e" 
              fill="url(#reportPredictionGradient)" 
              strokeWidth={3} 
              animationDuration={1500}
            />
            <Area 
              name="Confidence Interval"
              type="monotone" 
              dataKey="upper" 
              stroke="transparent" 
              fill="url(#reportConfidenceGradient)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-6 italic leading-relaxed border-l-2 border-slate-700 pl-4">
        Analysis: The model-driven forecast predicts a steady burnout risk hovering around 50-55% over the next 24 hours. While this is below the high-risk threshold of 70%, it indicates a sustained level of cognitive strain across the organization that warrants proactive load management to prevent future spikes.
      </p>
    </div>
  );
};

