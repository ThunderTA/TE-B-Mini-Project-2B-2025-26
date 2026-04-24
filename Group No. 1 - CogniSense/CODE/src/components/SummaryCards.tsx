import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { TrendingUp, Dna, ShieldCheck, ArrowUpRight, Eye, RotateCcw } from "lucide-react";

const baseCards = [
  {
    title: "Predictive Risk Detection",
    value: "87.3%",
    subtitle: "Model Accuracy (F1-Score)",
    trend: "+2.1%",
    icon: TrendingUp,
    accent: "primary",
  },
  {
    title: "GA Schedule Optimization",
    value: "34.7%",
    subtitle: "Cognitive Load Reduction",
    trend: "+8.4%",
    icon: Dna,
    accent: "success",
  },
  {
    title: "Privacy Compliance",
    value: "100%",
    subtitle: "Differential Privacy Active",
    trend: "Verified",
    icon: ShieldCheck,
    accent: "primary",
  },
];

const accentMap: Record<string, { bg: string; text: string; glow: string }> = {
  primary: { bg: "bg-primary/15", text: "text-primary", glow: "text-glow-teal" },
  success: { bg: "bg-success/15", text: "text-success", glow: "" },
};

export default function SummaryCards() {
  const [cards, setCards] = useState(baseCards);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        await fetch("/api/train").catch(() => {});
        const res = await fetch("/api/predictions/fatigue");
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) return;
        const avg = items.reduce((acc: number, r: any) => acc + (r.mentalFatiguePred ?? 0), 0) / items.length;
        const value = `${avg.toFixed(1)}%`;
        setCards((prev) => [
          ...prev,
          {
            title: "Predicted Mental Fatigue",
            value,
            subtitle: "Model from datasets/fatigueset",
            trend: "Live",
            icon: TrendingUp,
            accent: "primary",
          },
        ]);
      } catch {
        // ignore
      }
    };
    loadPredictions();
    // DISABLED WebSocket to prevent console errors
    // const isDevelopment = process.env.NODE_ENV === 'development';
    // if (!isDevelopment) return;
    // 
    // const ws = new WebSocket("ws://localhost:8000/ws/fatigue_prediction");
    // 
    // ws.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data);
    //     const v = typeof data.fatiguePrediction === "number" ? `${data.fatiguePrediction.toFixed(1)}%` : undefined;
    //     if (!v) return;
    //     setCards((prev) => {
    //       const exists = prev.find((c) => c.title === "Predicted Mental Fatigue");
    //       if (!exists) {
    //         return [
    //           ...prev,
    //           { title: "Predicted Mental Fatigue", value: v, subtitle: "Live updates", trend: "Live", icon: TrendingUp, accent: "primary" },
    //         ];
    //       }
    //       return prev.map((c) => (c.title === "Predicted Mental Fatigue" ? { ...c, value: v } : c));
    //     });
    //   } catch (err) {
    //     // Silent fail for WebSocket errors
    //   }
    // };
    // 
    // // Silent error handling
    // ws.onerror = () => {};
    // ws.onclose = () => {};
    // 
    // return () => {
    //   ws.close();
    // };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const a = accentMap[card.accent] || accentMap.primary;
        return (
          <div key={card.title} className="glass-card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${a.text}`} />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
            </div>
            <p className={`text-2xl font-bold font-mono ${a.text} ${a.glow}`}>{card.value}</p>
            <p className="text-xs font-medium text-foreground mt-1">{card.title}</p>
            <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
          </div>
        );
      })}

      {/* Action buttons row */}
      <div className="col-span-3 flex gap-3">
        <button
          onClick={() => navigate("/cognitive-load")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
        >
          <Eye className="w-4 h-4" />
          View Full Load Details
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/recovery/trigger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cluster: "Global", minutes: 20 }),
              });
              const data = await res.json();
              toast({
                title: "Recovery Block Scheduled",
                description: `Cluster: ${data.cluster} · Duration: ${data.minutes}m`,
              });
            } catch {
              toast({ title: "Recovery Failed", description: "Unable to schedule recovery", variant: "destructive" as any });
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-warning/10 border border-warning/20 text-sm font-medium text-warning hover:bg-warning/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Trigger Recovery Block
        </button>
      </div>
    </div>
  );
}
