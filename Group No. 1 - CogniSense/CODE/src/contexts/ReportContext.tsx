import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Data structures based on component analysis
interface TeamCluster { name: string; members: number; risk: number; load: number; lead: string; status: string; }
interface CognitiveLoadData {
  hourly: { hour: string; load: number; benchmark?: number }[];
  tasks: any[];
  radar: any[];
  metrics: any[];
}
interface BurnoutData { t: string; prediction: number; upper?: number; lower?: number; }

interface ReportDataContextType {
  teamClusters: TeamCluster[];
  cognitiveLoad: CognitiveLoadData | null;
  burnoutForecast: BurnoutData[];
  isLoading: boolean;
}

const ReportDataContext = createContext<ReportDataContextType | undefined>(undefined);

export const useReportData = () => {
  const context = useContext(ReportDataContext);
  if (!context) {
    throw new Error('useReportData must be used within a ReportDataProvider');
  }
  return context;
};

export const ReportDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamClusters, setTeamClusters] = useState<TeamCluster[]>([]);
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoadData | null>(null);
  const [burnoutForecast, setBurnoutForecast] = useState<BurnoutData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllReportData = async () => {
      setIsLoading(true);
      try {
        // In a real app, these would be API calls. For now, using mock data structures.
        const mockTeamClusters: TeamCluster[] = [
          { name: "ML Lab", members: 8, risk: 0.9, load: 88, lead: "Prof. Chen", status: "critical" },
          { name: "NLP Group", members: 6, risk: 0.45, load: 58, lead: "Dr. Patel", status: "moderate" },
          { name: "CV Research", members: 12, risk: 0.82, load: 82, lead: "Dr. Schmidt", status: "critical" },
          { name: "Stats Dept", members: 5, risk: 0.15, load: 32, lead: "Prof. Miller", status: "stable" },
          { name: "Ethics AI", members: 4, risk: 0.35, load: 45, lead: "Dr. Wong", status: "stable" },
          { name: "Ops Team", members: 10, risk: 0.68, load: 72, lead: "Sarah J.", status: "warning" },
        ];

        const mockCognitiveLoad: CognitiveLoadData = {
          hourly: [
            { hour: "8AM", load: 35, benchmark: 30 }, 
            { hour: "9AM", load: 52, benchmark: 45 },
            { hour: "10AM", load: 78, benchmark: 60 },
            { hour: "11AM", load: 85, benchmark: 65 },
            { hour: "12PM", load: 60, benchmark: 55 },
            { hour: "1PM", load: 45, benchmark: 40 },
            { hour: "2PM", load: 72, benchmark: 60 },
            { hour: "3PM", load: 80, benchmark: 65 },
            { hour: "4PM", load: 68, benchmark: 60 },
            { hour: "5PM", load: 42, benchmark: 45 },
            { hour: "6PM", load: 28, benchmark: 30 },
          ],
          tasks: [
            { task: "Thesis Review", intrinsic: 55, extraneous: 15, germane: 30 },
            { task: "Lab Meeting", intrinsic: 30, extraneous: 40, germane: 30 },
            { task: "Grant Writing", intrinsic: 70, extraneous: 10, germane: 20 },
            { task: "Data Analysis", intrinsic: 65, extraneous: 20, germane: 15 },
            { task: "Lecture Prep", intrinsic: 40, extraneous: 25, germane: 35 },
          ],
          radar: [
            { metric: "Working Memory", value: 72 },
            { metric: "Attention", value: 65 },
            { metric: "Processing Speed", value: 80 },
            { metric: "Task Switching", value: 45 },
            { metric: "Decision Fatigue", value: 58 },
            { metric: "Creative Output", value: 70 },
          ],
          metrics: [
            { label: "Avg. Cognitive Load", value: "62.4%" },
            { label: "Peak Load Today", value: "85%" },
            { label: "Recovery Efficiency", value: "92%" },
            { label: "Focus Score", value: "7.8/10" },
          ]
        };

        const mockBurnoutData: BurnoutData[] = [
          { t: 'T1', prediction: 50, upper: 55, lower: 45 },
          { t: 'T2', prediction: 52, upper: 58, lower: 46 },
          { t: 'T3', prediction: 55, upper: 62, lower: 48 },
          { t: 'T4', prediction: 58, upper: 65, lower: 51 },
          { t: 'T5', prediction: 54, upper: 62, lower: 46 },
          { t: 'T6', prediction: 51, upper: 59, lower: 43 },
          { t: 'T7', prediction: 48, upper: 55, lower: 41 },
          { t: 'T8', prediction: 50, upper: 57, lower: 43 },
          { t: 'T9', prediction: 53, upper: 61, lower: 45 },
          { t: 'T10', prediction: 56, upper: 64, lower: 48 },
          { t: 'T11', prediction: 59, upper: 68, lower: 50 },
          { t: 'T12', prediction: 62, upper: 72, lower: 52 },
        ];

        setTeamClusters(mockTeamClusters);
        setCognitiveLoad(mockCognitiveLoad);
        setBurnoutForecast(mockBurnoutData);

      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllReportData();
  }, []);

  const value = { teamClusters, cognitiveLoad, burnoutForecast, isLoading };

  return (
    <ReportDataContext.Provider value={value}>
      {children}
    </ReportDataContext.Provider>
  );
};