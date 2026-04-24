import { useEffect, useState } from "react";

export default function RadialGauge() {
  const [deepWork, setDeepWork] = useState(62);
  const [collaborative, setCollaborative] = useState(38);
    // DISABLED WebSocket to prevent console errors
  // useEffect(() => {
  //   const isDevelopment = process.env.NODE_ENV === 'development';
  //   if (!isDevelopment) return;
  //   
  //   const ws = new WebSocket("ws://localhost:8000/ws/work_balance");
  //   
  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       if (typeof data.deepWork === "number" && typeof data.collaborative === "number") {
  //         setDeepWork(data.deepWork);
  //         setCollaborative(data.collaborative);
  //       }
  //     } catch (err) {
  //       // Silent fail for WebSocket errors
  //     }
  //   };
  //   
  //   // Silent error handling
  //   ws.onerror = () => {};
  //   ws.onclose = () => {};
  //   
  //   return () => {
  //     ws.close();
  //   };
  // }, []);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const deepWorkArc = (deepWork / 100) * circumference;
  const collabArc = (collaborative / 100) * circumference;

  return (
    <div className="glass-card px-3 py-2 flex items-center gap-3">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(225 25% 18%)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke="hsl(170 100% 45%)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${deepWorkArc} ${circumference}`}
            style={{ filter: "drop-shadow(0 0 4px hsl(170 100% 45% / 0.5))" }}
          />
          <circle
            cx="50" cy="50" r={radius - 12} fill="none"
            stroke="hsl(38 90% 55%)"
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(collaborative / 100) * (2 * Math.PI * (radius - 12))} ${2 * Math.PI * (radius - 12)}`}
            style={{ filter: "drop-shadow(0 0 4px hsl(38 90% 55% / 0.5))" }}
          />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work Balance</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-foreground font-mono">{deepWork}% Deep</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs text-foreground font-mono">{collaborative}% Collab</span>
          </span>
        </div>
      </div>
    </div>
  );
}
