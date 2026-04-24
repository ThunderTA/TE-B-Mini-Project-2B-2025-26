import DashboardLayout from "@/components/DashboardLayout";
import { useView } from "@/contexts/ViewContext";
import FatigueHeatmap from "@/components/FatigueHeatmap";
import ContextAdvisor from "@/components/ContextAdvisor";
import DecayTaskList from "@/components/DecayTaskList";
import BurnoutForecast from "@/components/BurnoutForecast";
import SummaryCards from "@/components/SummaryCards";
import Chatbot from "@/components/Chatbot";
import DeadlineShiftSuggester from "@/components/DeadlineShiftSuggester";
import AutoDistributeWorkload from "@/components/AutoDistributeWorkload";
import RecoveryBlockSystem from "@/components/RecoveryBlockSystem";

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  academic: { title: "Academic Research Lab", subtitle: "Faculty & graduate researcher cognitive monitoring" },
  industrial: { title: "Industrial Operations", subtitle: "Employee productivity & wellbeing tracking" },
  government: { title: "Government Services", subtitle: "Public sector workforce management" },
};

const Index = () => {
  const { viewMode } = useView();
  const info = viewTitles[viewMode] || viewTitles.academic;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{info.title}</h2>
            <p className="text-xs text-muted-foreground">{info.subtitle}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground bg-accent px-2 py-1 rounded-lg capitalize">{viewMode} mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-12 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 auto-rows-auto lg:auto-rows-[minmax(0,1fr)]">
            <div id="fatigue-heatmap" className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "500ms" }}>
              <FatigueHeatmap />
            </div>
            <div className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "600ms" }}>
              <ContextAdvisor />
            </div>
            <div className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "700ms" }}>
              <DecayTaskList />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 auto-rows-auto lg:auto-rows-[minmax(0,1fr)]">
            <div id="burnout-forecast" className="lg:col-span-7 animate-fade-in h-full" style={{ animationDelay: "800ms" }}>
              <BurnoutForecast />
            </div>
            <div className="lg:col-span-5 animate-fade-in h-full" style={{ animationDelay: "900ms" }}>
              <SummaryCards />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 auto-rows-auto lg:auto-rows-[minmax(0,1fr)]">
            <div id="deadline-suggester" className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "1000ms" }}>
              <DeadlineShiftSuggester />
            </div>
            <div id="auto-distribute" className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "1100ms" }}>
              <AutoDistributeWorkload />
            </div>
            <div id="recovery-blocks" className="lg:col-span-4 animate-fade-in h-full" style={{ animationDelay: "1200ms" }}>
              <RecoveryBlockSystem />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
