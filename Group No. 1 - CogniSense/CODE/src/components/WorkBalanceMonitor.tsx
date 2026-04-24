import { useEffect, useState } from "react";
import { Brain, Users, BarChart3 } from "lucide-react";

export default function WorkBalanceMonitor() {
  const [workBalance, setWorkBalance] = useState({
    deepWork: 60,
    collaborative: 40,
    timestamp: new Date()
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/work_balance");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setWorkBalance({
        deepWork: data.deepWork,
        collaborative: data.collaborative,
        timestamp: new Date()
      });
    };
    return () => {
      ws.close();
    };
  }, []);

  const getBalanceStatus = () => {
    const diff = Math.abs(workBalance.deepWork - workBalance.collaborative);
    if (diff < 20) return { status: "Balanced", color: "text-green-500" };
    if (diff < 40) return { status: "Moderate", color: "text-yellow-500" };
    return { status: "Imbalanced", color: "text-red-500" };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Work Balance Monitor</h3>
        </div>
        <span className={`text-xs font-medium ${balanceStatus.color}`}>
          {balanceStatus.status}
        </span>
      </div>

      <div className="space-y-3">
        {/* Deep Work Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-foreground">Deep Work</span>
            </div>
            <span className="text-xs font-mono text-blue-500">{workBalance.deepWork}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${workBalance.deepWork}%`,
                background: "linear-gradient(90deg, hsl(211 100% 45%), hsl(211 100% 35%))"
              }}
            />
          </div>
        </div>

        {/* Collaborative Work Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-foreground">Collaborative</span>
            </div>
            <span className="text-xs font-mono text-green-500">{workBalance.collaborative}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${workBalance.collaborative}%`,
                background: "linear-gradient(90deg, hsl(142 100% 45%), hsl(142 100% 35%))"
              }}
            />
          </div>
        </div>

        {/* Balance Indicator */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Last Updated</span>
            <span className="text-xs font-mono text-muted-foreground">
              {workBalance.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
