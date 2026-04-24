import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Save, Sliders, BellRing, ShieldCheck, Palette, RefreshCw, Download, Upload, BarChart3, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { useView, TaskItem } from "@/contexts/ViewContext";
import { useReportData } from "@/contexts/ReportContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ReportTeamClusters, ReportCognitiveLoad, ReportBurnoutForecast, ReportTaskBreakdown, ReportRadarAnalysis } from "@/components/ReportVisuals";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Settings {
  appearance: {
    theme: "Light" | "Dark" | "System";
    accentColor: string;
    dataDensity: "Comfortable" | "Compact" | "Spacious";
    animations: boolean;
    compactMode: boolean;
  };
  notifications: {
    burnoutAlerts: boolean;
    recoveryReminders: boolean;
    weeklyReports: boolean;
    realTimeAlerts: boolean;
    emailNotifications: boolean;
    alertThreshold: number;
  };
  mlModels: {
    forecastHorizon: number;
    kmeansClusters: number;
    decayRate: number;
    modelRetraining: boolean;
    autoOptimize: boolean;
  };
  privacy: {
    differentialPrivacy: number;
    dataRetention: number;
    kAnonymity: number;
    anonymizationEnabled: boolean;
    dataSharing: boolean;
  };
}

const defaultSettings: Settings = {
  appearance: {
    theme: "System",
    accentColor: "Teal (170°)",
    dataDensity: "Comfortable",
    animations: true,
    compactMode: false,
  },
  notifications: {
    burnoutAlerts: true,
    recoveryReminders: true,
    weeklyReports: false,
    realTimeAlerts: true,
    emailNotifications: false,
    alertThreshold: 75,
  },
  mlModels: {
    forecastHorizon: 30,
    kmeansClusters: 12,
    decayRate: 0.034,
    modelRetraining: true,
    autoOptimize: true,
  },
  privacy: {
    differentialPrivacy: 0.5,
    dataRetention: 24,
    kAnonymity: 8,
    anonymizationEnabled: true,
    dataSharing: false,
  },
};

export default function SettingsPage() {
  const { tasks, setTasks } = useView();
  const reportData = useReportData();
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("cognitiveGuardSettings");
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
      console.error("Failed to parse settings from localStorage:", e);
      return defaultSettings;
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme immediately
    const applyTheme = (theme: string) => {
      if (theme === "System") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      } else {
        document.documentElement.classList.toggle("dark", theme === "Dark");
      }
    };
    applyTheme(settings.appearance.theme);

    // Apply data density immediately
    document.body.setAttribute("data-density", settings.appearance.dataDensity.toLowerCase());

    // Apply animations immediately
    document.body.setAttribute("data-animations", settings.appearance.animations.toString());

    // Apply compact mode immediately
    document.body.setAttribute("data-compact", settings.appearance.compactMode.toString());

    // Apply accent color immediately
    const root = document.documentElement;
    const accentColors: Record<string, { hsl: string; primary: string; ring: string }> = {
      "Teal (170°)": { hsl: "170 100% 45%", primary: "170", ring: "170" },
      "Purple (260°)": { hsl: "260 100% 45%", primary: "260", ring: "260" },
      "Orange (38°)": { hsl: "38 90% 55%", primary: "38", ring: "38" },
      "Blue (210°)": { hsl: "210 100% 45%", primary: "210", ring: "210" },
      "Green (142°)": { hsl: "142 70% 45%", primary: "142", ring: "142" }
    };
    
    const color = accentColors[settings.appearance.accentColor];
    if (color) {
      root.style.setProperty("--primary", color.hsl);
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      root.style.setProperty("--ring", color.ring);
    }
  }, [settings.appearance]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(defaultSettings));
  }, [settings]);

  const updateSetting = (category: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("cognitiveGuardSettings", JSON.stringify(settings));
      
      // Apply settings to server if needed
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      toast({ 
        title: "Settings Saved", 
        description: "Your preferences have been saved successfully." 
      });
    } catch (error) {
      toast({ 
        title: "Save Failed", 
        description: "Could not save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("cognitiveGuardSettings");
    toast({ 
      title: "Settings Reset", 
      description: "All settings have been reset to defaults." 
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `cognisense-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportReportPDF = async (theme: 'system' | 'plain') => {
    setIsExporting(true);
    setShowExportDialog(false);
    toast({ title: "Generating Report", description: `Preparing ${theme === 'plain' ? 'Plain White' : 'System Theme'} analysis PDF...` });

    try {
      const reportContainer = reportRef.current;
      if (!reportContainer) return;

      // Temporary styles for plain white theme
      const originalStyle = reportContainer.style.cssText;
      if (theme === 'plain') {
        reportContainer.style.backgroundColor = "#ffffff";
        reportContainer.style.color = "#0f172a";
        // Update nested elements for plain theme
        const cards = reportContainer.querySelectorAll('.bg-slate-900\\/50');
        cards.forEach((card: any) => {
          card.style.backgroundColor = "#f8fafc";
          card.style.borderColor = "#e2e8f0";
        });
        const texts = reportContainer.querySelectorAll('.text-slate-100, .text-slate-200, .text-slate-300');
        texts.forEach((text: any) => text.style.color = "#1e293b");
        const secondaryTexts = reportContainer.querySelectorAll('.text-slate-400, .text-slate-500');
        secondaryTexts.forEach((text: any) => text.style.color = "#64748b");
      }

      // Use html2canvas on the entire container to get one tall image
      const canvas = await html2canvas(reportContainer, {
        scale: 2,
        backgroundColor: theme === 'plain' ? "#ffffff" : "#030712",
        windowWidth: reportContainer.scrollWidth,
        windowHeight: reportContainer.scrollHeight,
        useCORS: true,
        logging: false,
      });

      // Revert styles
      if (theme === 'plain') {
        reportContainer.style.cssText = originalStyle;
        const cards = reportContainer.querySelectorAll('.bg-slate-900\\/50');
        cards.forEach((card: any) => {
          card.style.backgroundColor = "";
          card.style.borderColor = "";
        });
        const texts = reportContainer.querySelectorAll('.text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-slate-500');
        texts.forEach((text: any) => text.style.color = "");
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / contentWidth;
      const scaledImgHeight = imgProps.height / ratio;

      let yPos = 0;
      let heightLeft = scaledImgHeight;

      // Add the first page
      pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, scaledImgHeight);
      heightLeft -= (pdfHeight - margin);

      // Add new pages if the content is taller than one page
      while (heightLeft > 0) {
        yPos -= (pdfHeight - margin * 2); // Negative y-position to show the next slice of the image
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, scaledImgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      const date = new Date();
      const fileName = `report_${date.toISOString().replace(/:/g, '-')}.pdf`;
      pdf.save(fileName);

      toast({ title: "Report Exported", description: `Saved as ${fileName}` });
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast({ title: "Export Failed", description: "Failed to generate PDF report.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          
          // Check if it's a task dataset or system settings
          if (Array.isArray(imported) && imported.length > 0 && 'task' in imported[0]) {
            setTasks(imported as TaskItem[]);
            toast({ 
              title: "Dataset Imported", 
              description: `${imported.length} tasks loaded into the Planner.` 
            });
          } else {
            setSettings({ ...defaultSettings, ...imported });
            toast({ 
              title: "Settings Imported", 
              description: "System preferences updated successfully." 
            });
          }
        } catch (error) {
          toast({ 
            title: "Import Failed", 
            description: "Invalid file format. Please upload a valid JSON dataset.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Analytical mock data for report-exclusive comparative sections
  const efficiencyData = [
    { name: 'Optimized Completion', value: 82, color: '#10b981' },
    { name: 'Under Review', value: 12, color: '#f59e0b' },
    { name: 'Bottlenecked', value: 6, color: '#ef4444' }
  ];

  const beforeEnhancementData = [
    { name: 'Standard Completion', value: 58, color: '#10b981' },
    { name: 'Manual Review', value: 22, color: '#f59e0b' },
    { name: 'System Latency', value: 20, color: '#ef4444' }
  ];

  const performanceOverTime = [
    { month: 'Oct', manual: 45, enhanced: 48, efficiency: 12 },
    { month: 'Nov', manual: 48, enhanced: 55, efficiency: 18 },
    { month: 'Dec', manual: 52, enhanced: 68, efficiency: 25 },
    { month: 'Jan', manual: 55, enhanced: 78, efficiency: 32 },
    { month: 'Feb', manual: 58, enhanced: 85, efficiency: 40 },
    { month: 'Mar', manual: 60, enhanced: 92, efficiency: 45 },
  ];

  const systemEfficiency = [
    { metric: 'Latency (ms)', before: 450, after: 42, unit: 'ms' },
    { metric: 'Error Rate (%)', before: 18.5, after: 2.1, unit: '%' },
    { metric: 'Throughput', before: 120, after: 850, unit: 'req/s' },
    { metric: 'Cognitive ROI', before: 1.2, after: 8.4, unit: 'x' },
  ];

  return (
    <DashboardLayout showMetrics={false}>
      {/* Hidden Report Container for PDF Export */}
      <div className="fixed -left-[2000px] top-0">
        <div 
          ref={reportRef} 
          className="w-[800px] p-10 bg-slate-950 text-slate-100 flex flex-col gap-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">CogniSense™ Analysis Report</h1>
              <p className="text-slate-400 text-sm mt-1">Cognitive Load & System Efficiency Audit</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-slate-500">ID: CS-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Efficiency: Before Enhancement</h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={beforeEnhancementData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      {beforeEnhancementData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Efficiency: After Enhancement</h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={efficiencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      {efficiencyData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Historical Performance & Efficiency Delta</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="manual" name="Baseline (Manual)" stroke="#ef4444" strokeWidth={2} dot={{r:4}} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="enhanced" name="CogniSense Enhanced" stroke="#10b981" strokeWidth={3} dot={{r:5}} />
                  <Line type="monotone" dataKey="efficiency" name="Efficiency Gain (%)" stroke="#6366f1" strokeWidth={2} dot={{r:4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">System Optimization Metrics</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                    formatter={(value, name, entry: any) => [`${value}${entry?.payload?.unit || ""}`, name]}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="before" name="Pre-Optimization" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="after" name="Post-Optimization" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Data Sections */}
          {reportData.isLoading ? (
            <div className="text-center text-slate-400 py-20">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm font-medium">Aggregating real-time cognitive metrics...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8">
                <ReportTeamClusters data={reportData.teamClusters} />
                
                <div className="grid grid-cols-2 gap-6">
                  <ReportCognitiveLoad data={reportData.cognitiveLoad} />
                  <ReportRadarAnalysis data={reportData.cognitiveLoad?.radar || []} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <ReportTaskBreakdown data={reportData.cognitiveLoad?.tasks || []} />
                  <ReportBurnoutForecast data={reportData.burnoutForecast} />
                </div>
              </div>

              {/* Intelligent Insights & Recommendations */}
              <div className="bg-slate-900/50 p-8 rounded-2xl border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  AI-Driven Strategic Recommendations
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Immediate Actions</h3>
                    <ul className="space-y-3">
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></div>
                        <span>Initiate mandatory recovery block for <strong>ML Lab</strong> team (Risk &gt; 90%).</span>
                      </li>
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0"></div>
                        <span>Restructure <strong>Lab Meetings</strong> to reduce extraneous cognitive load by 25%.</span>
                      </li>
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                        <span>Redistribute high-intrinsic tasks from <strong>CV Research</strong> to <strong>Stats Dept</strong>.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Long-term Strategy</h3>
                    <ul className="space-y-3">
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1 shrink-0"></div>
                        <span>Implement <strong>LSTM-based</strong> workload forecasting to prevent Tuesday/Thursday peaks.</span>
                      </li>
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1 shrink-0"></div>
                        <span>Augment <strong>Working Memory</strong> capacity through optimized focus-block scheduling.</span>
                      </li>
                      <li className="flex gap-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1 shrink-0"></div>
                        <span>Deploy <strong>CogniSense Edge™</strong> nodes for lower latency fatigue detection.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-auto pt-10 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">End of All-Inclusive Analysis Report · CogniSense™ AI</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">System Configuration</h2>
          <p className="text-xs text-muted-foreground">Manage dashboard preferences, ML model parameters, and privacy settings</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} disabled={isExporting}>
              <FileText className="w-3 h-3 mr-1" />
              {isExporting ? "Exporting..." : "Export Report (PDF)"}
            </Button>
            <AlertDialogContent className="glass-card border-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-200">Export Report Theme</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 text-sm">
                  Choose the visual style for your cognitive analysis report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <button 
                  onClick={() => exportReportPDF('system')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-full h-20 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">System Theme (Dark)</span>
                </button>
                <button 
                  onClick={() => exportReportPDF('plain')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-full h-20 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Plain White (Professional)</span>
                </button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="w-3 h-3 mr-1" />
              Import Dataset
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={isSaving || !hasChanges}>
            <Save className="w-3 h-3 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => window.open('http://localhost:3000/analysis/index.html', '_blank')}>
            <BarChart3 className="w-3 h-3 mr-1" />
            Comparative Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Appearance Settings */}
        <Card className="glass-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the visual appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Theme</Label>
              <Select value={settings.appearance.theme} onValueChange={(v: any) => updateSetting('appearance', 'theme', v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Dark">Dark</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Accent Color</Label>
              <Select value={settings.appearance.accentColor} onValueChange={(v) => updateSetting('appearance', 'accentColor', v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teal (170°)">Teal (170°)</SelectItem>
                  <SelectItem value="Purple (260°)">Purple (260°)</SelectItem>
                  <SelectItem value="Orange (38°)">Orange (38°)</SelectItem>
                  <SelectItem value="Blue (210°)">Blue (210°)</SelectItem>
                  <SelectItem value="Green (142°)">Green (142°)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Data Density</Label>
              <Select value={settings.appearance.dataDensity} onValueChange={(v: any) => updateSetting('appearance', 'dataDensity', v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spacious">Spacious</SelectItem>
                  <SelectItem value="Comfortable">Comfortable</SelectItem>
                  <SelectItem value="Compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Animations</Label>
                <p className="text-[10px] text-muted-foreground">Enable UI animations</p>
              </div>
              <Switch checked={settings.appearance.animations} onCheckedChange={(v) => updateSetting('appearance', 'animations', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Compact Mode</Label>
                <p className="text-[10px] text-muted-foreground">Reduce spacing between elements</p>
              </div>
              <Switch checked={settings.appearance.compactMode} onCheckedChange={(v) => updateSetting('appearance', 'compactMode', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: "50ms" }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Notifications
            </CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Burnout Alerts</Label>
                <p className="text-[10px] text-muted-foreground">High risk notifications</p>
              </div>
              <Switch checked={settings.notifications.burnoutAlerts} onCheckedChange={(v) => updateSetting('notifications', 'burnoutAlerts', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Recovery Reminders</Label>
                <p className="text-[10px] text-muted-foreground">Suggest recovery blocks</p>
              </div>
              <Switch checked={settings.notifications.recoveryReminders} onCheckedChange={(v) => updateSetting('notifications', 'recoveryReminders', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Weekly Reports</Label>
                <p className="text-[10px] text-muted-foreground">Email summaries</p>
              </div>
              <Switch checked={settings.notifications.weeklyReports} onCheckedChange={(v) => updateSetting('notifications', 'weeklyReports', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Real-time Alerts</Label>
                <p className="text-[10px] text-muted-foreground">Live notifications</p>
              </div>
              <Switch checked={settings.notifications.realTimeAlerts} onCheckedChange={(v) => updateSetting('notifications', 'realTimeAlerts', v)} />
            </div>

            <div>
              <Label className="text-xs font-medium">Alert Threshold: {settings.notifications.alertThreshold}%</Label>
              <Slider
                value={[settings.notifications.alertThreshold]}
                onValueChange={([v]) => updateSetting('notifications', 'alertThreshold', v)}
                min={50}
                max={95}
                step={5}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* ML Model Settings */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              ML Models
            </CardTitle>
            <CardDescription>Configure machine learning parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Forecast Horizon: {settings.mlModels.forecastHorizon} days</Label>
              <Slider
                value={[settings.mlModels.forecastHorizon]}
                onValueChange={([v]) => updateSetting('mlModels', 'forecastHorizon', v)}
                min={7}
                max={90}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">K-Means Clusters: {settings.mlModels.kmeansClusters}</Label>
              <Slider
                value={[settings.mlModels.kmeansClusters]}
                onValueChange={([v]) => updateSetting('mlModels', 'kmeansClusters', v)}
                min={3}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Decay Rate (λ): {settings.mlModels.decayRate.toFixed(3)}/hr</Label>
              <Slider
                value={[settings.mlModels.decayRate]}
                onValueChange={([v]) => updateSetting('mlModels', 'decayRate', v)}
                min={0.01}
                max={0.1}
                step={0.001}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Auto Retraining</Label>
                <p className="text-[10px] text-muted-foreground">Automatic model updates</p>
              </div>
              <Switch checked={settings.mlModels.modelRetraining} onCheckedChange={(v) => updateSetting('mlModels', 'modelRetraining', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Auto Optimization</Label>
                <p className="text-[10px] text-muted-foreground">Self-tuning parameters</p>
              </div>
              <Switch checked={settings.mlModels.autoOptimize} onCheckedChange={(v) => updateSetting('mlModels', 'autoOptimize', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Privacy & Compliance
            </CardTitle>
            <CardDescription>Data protection and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Differential Privacy ε: {settings.privacy.differentialPrivacy}</Label>
              <Slider
                value={[settings.privacy.differentialPrivacy]}
                onValueChange={([v]) => updateSetting('privacy', 'differentialPrivacy', v)}
                min={0.1}
                max={2.0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Data Retention: {settings.privacy.dataRetention} hours</Label>
              <Slider
                value={[settings.privacy.dataRetention]}
                onValueChange={([v]) => updateSetting('privacy', 'dataRetention', v)}
                min={1}
                max={168}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">K-Anonymity: k={settings.privacy.kAnonymity}</Label>
              <Slider
                value={[settings.privacy.kAnonymity]}
                onValueChange={([v]) => updateSetting('privacy', 'kAnonymity', v)}
                min={2}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Anonymization</Label>
                <p className="text-[10px] text-muted-foreground">Enable data anonymization</p>
              </div>
              <Switch checked={settings.privacy.anonymizationEnabled} onCheckedChange={(v) => updateSetting('privacy', 'anonymizationEnabled', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Data Sharing</Label>
                <p className="text-[10px] text-muted-foreground">Share anonymized data</p>
              </div>
              <Switch checked={settings.privacy.dataSharing} onCheckedChange={(v) => updateSetting('privacy', 'dataSharing', v)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
