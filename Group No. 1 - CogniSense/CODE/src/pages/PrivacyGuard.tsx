import DashboardLayout from "@/components/DashboardLayout";
import { useView } from "@/contexts/ViewContext";
import { Shield, ShieldCheck, Lock, EyeOff, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const viewPolicies: Record<string, any[]> = {
  academic: [
    { name: "IRB Compliance", status: "active", description: "All research protocols approved by Institutional Review Board", icon: Shield },
    { name: "FERPA Protection", status: "active", description: "Student data protected under Federal Education Rights & Privacy Act", icon: Lock },
    { name: "Data Minimization", status: "active", description: "Only aggregated metrics retained; raw data purged after 24h", icon: EyeOff },
    { name: "Consent Management", status: "active", description: "All participants opted-in with revocable consent tokens", icon: FileCheck },
  ],
  industrial: [
    { name: "Differential Privacy", status: "active", description: "ε = 0.5, δ = 10⁻⁵ noise injection on all biometric signals", icon: Lock },
    { name: "K-Anonymity", status: "active", description: "k = 8 minimum cluster size enforced across all team views", icon: Shield },
    { name: "Data Minimization", status: "active", description: "Only aggregated metrics retained; raw data purged after 24h", icon: EyeOff },
    { name: "SOC 2 Compliance", status: "active", description: "Type II audit passed; continuous monitoring active", icon: FileCheck },
  ],
  government: [
    { name: "FedRAMP Authorization", status: "active", description: "Moderate baseline authorization for federal data processing", icon: Shield },
    { name: "FISMA Compliance", status: "active", description: "All systems meet NIST SP 800-53 security controls", icon: Lock },
    { name: "PII Protection", status: "active", description: "Personally identifiable information encrypted at rest and in transit", icon: EyeOff },
    { name: "Section 508", status: "active", description: "Full accessibility compliance for government platforms", icon: FileCheck },
  ],
};

const viewAuditLog: Record<string, any[]> = {
  academic: [
    { time: "5 min ago", event: "IRB audit completed", severity: "info", detail: "All 12 research groups meet compliance threshold" },
    { time: "30 min ago", event: "FERPA check passed", severity: "info", detail: "Student data access controls verified" },
    { time: "2h ago", event: "Unauthorized data request blocked", severity: "warning", detail: "External query for individual student data denied" },
    { time: "6h ago", event: "Data retention purge", severity: "info", detail: "Raw biometric data older than 24h purged" },
  ],
  industrial: [
    { time: "2 min ago", event: "Privacy audit completed", severity: "info", detail: "All 12 clusters meet k-anonymity threshold" },
    { time: "15 min ago", event: "Noise calibration updated", severity: "info", detail: "ε adjusted from 0.6 to 0.5 for stricter privacy" },
    { time: "1h ago", event: "Access request denied", severity: "warning", detail: "Unauthorized query for individual-level data blocked" },
    { time: "3h ago", event: "Data retention purge", severity: "info", detail: "Raw biometric data older than 24h successfully purged" },
    { time: "6h ago", event: "New consent registered", severity: "info", detail: "3 new participants opted in with consent tokens" },
    { time: "1d ago", event: "SOC 2 report generated", severity: "info", detail: "Monthly SOC 2 compliance report auto-generated" },
  ],
  government: [
    { time: "10 min ago", event: "FedRAMP scan completed", severity: "info", detail: "All 142 security controls verified" },
    { time: "45 min ago", event: "FISMA assessment updated", severity: "info", detail: "Risk level maintained at LOW" },
    { time: "2h ago", event: "PII access attempt blocked", severity: "warning", detail: "Unauthorized agency query for personnel records denied" },
    { time: "4h ago", event: "Section 508 audit passed", severity: "info", detail: "All interfaces meet WCAG 2.1 AA standards" },
    { time: "1d ago", event: "Authority to Operate renewed", severity: "info", detail: "ATO renewed for another 3-year cycle" },
  ],
};

export default function PrivacyGuard() {
  const { viewMode } = useView();
  const policies = viewPolicies[viewMode];
  const auditLog = viewAuditLog[viewMode];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Privacy Guard</h2>
          <p className="text-xs text-muted-foreground">Data protection policies · <span className="capitalize">{viewMode}</span> compliance</p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span className="text-xs font-medium text-success">All Systems Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-[11px] text-muted-foreground mb-1">Privacy Score</p>
          <p className="text-3xl font-bold font-mono text-success text-glow-teal">100%</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All policies active</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-[11px] text-muted-foreground mb-1">Data Anonymized</p>
          <p className="text-3xl font-bold font-mono text-primary">12/12</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Clusters protected</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-[11px] text-muted-foreground mb-1">Access Violations</p>
          <p className="text-3xl font-bold font-mono text-foreground">1</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Blocked in last 24h</p>
        </div>
      </div>

      <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <h3 className="text-sm font-semibold text-foreground mb-3">Active Privacy Policies</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {policies.map((p: any) => (
            <div key={p.name} className="rounded-lg bg-muted/30 border border-border/50 p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/15 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <h3 className="text-sm font-semibold text-foreground mb-3">Audit Log</h3>
        <div className="space-y-1.5">
          {auditLog.map((entry: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/20 p-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${entry.severity === "warning" ? "bg-warning/15" : "bg-primary/10"}`}>
                {entry.severity === "warning" ? <AlertTriangle className="w-2.5 h-2.5 text-warning" /> : <CheckCircle2 className="w-2.5 h-2.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{entry.event}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
