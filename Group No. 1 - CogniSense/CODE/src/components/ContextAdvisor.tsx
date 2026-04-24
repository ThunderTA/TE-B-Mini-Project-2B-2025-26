import { Lightbulb, ArrowRight, CalendarClock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

export default function ContextAdvisor() {
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleAction = async (actionName: string, apiCall: () => Promise<any>, successMsg: (data: any) => string) => {
    setStatus({ type: 'loading', message: `Processing ${actionName}...` });
    try {
      const data = await apiCall();
      const msg = successMsg(data);
      setStatus({ type: 'success', message: msg });
      addNotification({
        title: actionName,
        message: msg,
        type: 'success'
      });
      // Reset to idle after 5 seconds
      setTimeout(() => setStatus(prev => prev.message === msg ? { type: 'idle', message: '' } : prev), 5000);
    } catch (err) {
      const errorMsg = `Failed to ${actionName.toLowerCase()}`;
      setStatus({ type: 'error', message: errorMsg });
      addNotification({
        title: `${actionName} Failed`,
        message: "Unable to complete the requested action.",
        type: 'error'
      });
    }
  };

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Context-Aware Advisor</h3>
            <p className="text-xs text-muted-foreground">Bayesian Reasoning Engine</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {status.type !== 'idle' ? (
          <div className={`rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in duration-300 h-full border ${
            status.type === 'loading' ? 'bg-muted/30 border-border' :
            status.type === 'success' ? 'bg-success/5 border-success/20' :
            'bg-destructive/5 border-destructive/20'
          }`}>
            {status.type === 'loading' && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status.type === 'success' && <CheckCircle2 className="w-8 h-8 text-success" />}
            {status.type === 'error' && <AlertCircle className="w-8 h-8 text-destructive" />}
            <p className={`text-xs font-medium ${
              status.type === 'loading' ? 'text-muted-foreground' :
              status.type === 'success' ? 'text-success' :
              'text-destructive'
            }`}>
              {status.message}
            </p>
            {status.type !== 'loading' && (
              <button 
                onClick={() => setStatus({ type: 'idle', message: '' })}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Dismiss
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-warning/5 border border-warning/15 p-3.5">
              <p className="text-xs text-foreground leading-relaxed">
                <span className="text-warning font-semibold">Recommendation:</span> Shift the
                <span className="font-mono text-primary mx-1">Sprint-14</span>
                deadline by <span className="font-semibold text-warning">+2 days</span>.
              </p>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Bayesian posterior probability of burnout for the Design cluster is
                <span className="font-mono text-destructive mx-1">P(B|D) = 0.78</span>.
                Given current cognitive decay rate (λ = 0.034/hr), team recovery requires
                ~14 hours of distributed rest blocks before cognitive capacity returns to baseline.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
              <CalendarClock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Genetic Algorithm schedule optimization suggests moving 3 high-cost tasks to
                post-recovery windows with <span className="font-mono text-primary">94.2%</span> confidence.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          disabled={status.type === 'loading'}
          onClick={() => handleAction(
            "Deadline Suggestion",
            () => fetch("/api/deadline_suggest").then(res => res.json()),
            (data) => `${data.recommendation} · Confidence ${Math.round((data.confidence || 0) * 100)}%`
          )}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/15 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
        >
          <CalendarClock className="w-4 h-4" />
          Suggest Deadline Shift
        </button>
        <button
          disabled={status.type === 'loading'}
          onClick={() => handleAction(
            "Auto-Distribute Proposal",
            () => fetch("/api/auto_distribute").then(res => res.json()),
            (data) => Array.isArray(data?.moves)
              ? data.moves.map((m: any) => `${m.task}: ${m.from} → ${m.to}`).join(" · ")
              : "No moves proposed"
          )}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-accent border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={status.type === 'loading'}
          onClick={() => handleAction(
            "Recovery Block",
            () => fetch("/api/recovery/trigger", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ cluster: "Design", minutes: 30 }) 
            }).then(res => res.json()),
            (data) => `Scheduled for ${data.cluster} · ${data.minutes}m`
          )}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning/15 border border-warning/20 text-sm text-warning hover:bg-warning/25 transition-colors disabled:opacity-50"
        >
          Trigger Recovery
        </button>
      </div>
    </div>
  );
}
