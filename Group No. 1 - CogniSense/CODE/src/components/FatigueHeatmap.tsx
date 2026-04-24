import { Shield, Activity, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useView } from "@/contexts/ViewContext";

function getColor(risk: number) {
  if (risk >= 0.7) return { bg: "bg-destructive/30", border: "border-destructive/40", text: "text-destructive" };
  if (risk >= 0.4) return { bg: "bg-warning/20", border: "border-warning/30", text: "text-warning" };
  return { bg: "bg-success/20", border: "border-success/30", text: "text-success" };
}

export default function FatigueHeatmap() {
  const [clusters, setClusters] = useState<{ id: number; risk: number; label: string }[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { viewMode } = useView();

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const endpoint = viewMode === "government" ? "/api/heatmap_privacy" : "/api/heatmap";
        const res = await fetch(endpoint);
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        setClusters(items);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusters();
    const interval = setInterval(fetchClusters, 10000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const getAverageRisk = () => {
    if (clusters.length === 0) return 0;
    return clusters.reduce((sum, cluster) => sum + cluster.risk, 0) / clusters.length;
  };

  const getHighRiskCount = () => {
    return clusters.filter(cluster => cluster.risk >= 0.7).length;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fatigue Heatmap</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Fatigue Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time team cognitive load from fatigueset
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Live Data</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Avg Risk</div>
          <div className="text-sm font-bold text-foreground">
            {Math.round(getAverageRisk() * 100)}%
          </div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground">High Risk</div>
          <div className="text-sm font-bold text-destructive">
            {getHighRiskCount()}
          </div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Teams</div>
          <div className="text-sm font-bold text-foreground">
            {clusters.length}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-4 gap-2">
        {clusters.map((c) => {
          const colors = getColor(c.risk);
          return (
            <div
              key={c.id}
              className={`relative ${colors.bg} ${colors.border} border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 cursor-pointer group`}
              title={`${c.label}: ${Math.round(c.risk * 100)}% risk`}
            >
              {/* Animated pulse for high risk */}
              {c.risk >= 0.7 && (
                <div className="absolute inset-0 rounded-xl animate-pulse opacity-30 bg-destructive/20" />
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                  boxShadow: c.risk >= 0.7 
                    ? "inset 0 0 20px hsl(348 75% 60% / 0.15)" 
                    : c.risk >= 0.4 
                    ? "inset 0 0 20px hsl(38 90% 55% / 0.1)" 
                    : "inset 0 0 20px hsl(155 70% 45% / 0.1)" 
                }}
              />
              
              <div className="flex items-center gap-1">
                <span className={`text-lg font-bold font-mono ${colors.text}`}>
                  {Math.round(c.risk * 100)}
                </span>
                {c.risk >= 0.7 && (
                  <Activity className="w-3 h-3 text-destructive animate-pulse" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center">
                {c.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-success" />
          <span className="text-[10px] text-muted-foreground">Stable (&lt;40)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-warning" />
          <span className="text-[10px] text-muted-foreground">Moderate (40-70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-destructive" />
          <span className="text-[10px] text-muted-foreground">High Risk (&gt;70)</span>
        </div>
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <TrendingUp className="w-3 h-3" />
        <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
