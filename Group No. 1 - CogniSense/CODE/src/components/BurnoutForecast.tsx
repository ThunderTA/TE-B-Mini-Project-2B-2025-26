import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useEffect, useState } from "react";

type Point = { t: string; prediction: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono" style={{ color: p.color }}>
          Predicted: {p.value}%
        </p>
      ))}
    </div>
  );
};

export default function BurnoutForecast() {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch("/api/burnout_forecast");
        if (!res.ok) return;
        const payload = await res.json();
        const items: Point[] = Array.isArray(payload?.items) ? payload.items : [];
        setData(items);
      } catch {
        // ignore
      }
    };
    fetchForecast();
  }, []);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Burnout Risk Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Model-driven forecast</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-destructive" style={{ borderStyle: "dashed" }} />
            <span className="text-[10px] text-muted-foreground">Predicted</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(348 75% 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(348 75% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 25% 18%)" />
          <XAxis
            dataKey="t" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
            axisLine={{ stroke: "hsl(225 25% 18%)" }} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
            axisLine={false} tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="hsl(348 75% 60% / 0.4)" strokeDasharray="4 4" label={{
            value: "High Risk Threshold",
            position: "insideTopRight",
            style: { fontSize: 9, fill: "hsl(348 75% 60%)" }
          }} />
          <Area
            type="monotone" dataKey="prediction" stroke="hsl(348 75% 60%)"
            fill="url(#predictionGradient)" strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: "hsl(348 75% 60%)", r: 3, strokeWidth: 0 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
