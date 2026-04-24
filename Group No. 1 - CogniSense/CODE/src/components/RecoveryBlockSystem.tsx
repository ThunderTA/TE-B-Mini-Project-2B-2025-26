import { useState, useEffect } from "react";
import { RotateCcw, Clock, Users, AlertTriangle, CheckCircle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/contexts/NotificationContext";

interface RecoveryBlock {
  id: string;
  cluster: string;
  duration: number;
  status: "scheduled" | "active" | "completed";
  startTime?: Date;
  endTime?: Date;
  reason: string;
}

export default function RecoveryBlockSystem() {
  const [recoveryBlocks, setRecoveryBlocks] = useState<RecoveryBlock[]>([]);
  const [selectedCluster, setSelectedCluster] = useState("Global");
  const [selectedDuration, setSelectedDuration] = useState("15");
  const [isScheduling, setIsScheduling] = useState(false);
  const [teamFatigue, setTeamFatigue] = useState<Record<string, number>>({});
  const { addNotification } = useNotifications();

  const clusters = [
    "Global", "Eng-A", "Eng-B", "Design", "Ops", "Research", 
    "QA", "ML-Ops", "DevRel", "PM", "Data", "Infra", "Sales"
  ];

  const durations = [
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "20", label: "20 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
  ];

  useEffect(() => {
    fetchTeamFatigue();
    fetchRecoveryBlocks();
    const interval = setInterval(fetchTeamFatigue, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTeamFatigue = async () => {
    try {
      const response = await fetch("/api/heatmap");
      const data = await response.json();
      if (data.items) {
        const fatigueMap: Record<string, number> = {};
        data.items.forEach((item: any) => {
          fatigueMap[item.label] = item.risk;
        });
        setTeamFatigue(fatigueMap);
      }
    } catch (error) {
      console.error("Failed to fetch team fatigue:", error);
    }
  };

  const fetchRecoveryBlocks = async () => {
    // In a real implementation, this would fetch from an API
    const mockBlocks: RecoveryBlock[] = [
      {
        id: "1",
        cluster: "ML-Ops",
        duration: 15,
        status: "completed",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() - 45 * 60 * 1000),
        reason: "High cognitive load detected (85%)"
      },
      {
        id: "2",
        cluster: "Design",
        duration: 20,
        status: "active",
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        endTime: new Date(Date.now() + 10 * 60 * 1000),
        reason: "Sustained high workload"
      }
    ];
    setRecoveryBlocks(mockBlocks);
  };

  const scheduleRecoveryBlock = async () => {
    setIsScheduling(true);
    try {
      const response = await fetch("/api/recovery/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cluster: selectedCluster, 
          minutes: parseInt(selectedDuration) 
        }),
      });

      const data = await response.json();
      
      const newBlock: RecoveryBlock = {
        id: Date.now().toString(),
        cluster: selectedCluster,
        duration: parseInt(selectedDuration),
        status: "scheduled",
        startTime: new Date(),
        endTime: new Date(Date.now() + parseInt(selectedDuration) * 60 * 1000),
        reason: data.status || "Manual recovery block triggered"
      };

      setRecoveryBlocks(prev => [newBlock, ...prev]);

      addNotification({
        title: "Recovery Block Scheduled",
        message: `${selectedCluster}: ${selectedDuration} minutes recovery block scheduled.`,
        type: "success"
      });

      // Update active blocks after a delay
      setTimeout(() => {
        setRecoveryBlocks(prev => 
          prev.map(block => 
            block.id === newBlock.id 
              ? { ...block, status: "active" as const }
              : block
          )
        );
      }, 1000);

    } catch (error) {
      addNotification({
        title: "Failed to Schedule Recovery",
        message: "Unable to schedule recovery block. Please try again.",
        type: "error"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const getRecommendation = () => {
    const clusterFatigue = teamFatigue[selectedCluster] || 0;
    if (clusterFatigue > 0.8) {
      return {
        recommended: true,
        duration: "30",
        reason: "Critical fatigue level detected",
        urgency: "high"
      };
    } else if (clusterFatigue > 0.6) {
      return {
        recommended: true,
        duration: "15",
        reason: "High cognitive load",
        urgency: "medium"
      };
    }
    return {
      recommended: false,
      duration: "10",
      reason: "Fatigue levels are manageable",
      urgency: "low"
    };
  };

  const recommendation = getRecommendation();
  const activeBlocks = recoveryBlocks.filter(block => block.status === "active");
  const scheduledBlocks = recoveryBlocks.filter(block => block.status === "scheduled");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      default: return "text-green-500";
    }
  };

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Recovery Block System
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeBlocks.length > 0 && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                {activeBlocks.length} Active
              </Badge>
            )}
            {scheduledBlocks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {scheduledBlocks.length} Scheduled
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          AI-powered recovery blocks to prevent burnout and maintain performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendation */}
        {recommendation.recommended && (
          <Alert className={`border-${recommendation.urgency === "high" ? "red" : recommendation.urgency === "medium" ? "yellow" : "green"}-200 bg-${recommendation.urgency === "high" ? "red" : recommendation.urgency === "medium" ? "yellow" : "green"}-50 dark:bg-${recommendation.urgency === "high" ? "red" : recommendation.urgency === "medium" ? "yellow" : "green"}-950`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={getUrgencyColor(recommendation.urgency)}>
              <strong>Recommendation:</strong> {recommendation.reason}. 
              Suggested duration: {recommendation.duration} minutes.
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Cluster/Team</label>
            <Select value={selectedCluster} onValueChange={setSelectedCluster}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clusters.map(cluster => (
                  <SelectItem key={cluster} value={cluster} className="text-xs">
                    {cluster}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Duration</label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map(duration => (
                  <SelectItem key={duration.value} value={duration.value} className="text-xs">
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={scheduleRecoveryBlock}
          disabled={isScheduling}
          className="w-full text-sm"
        >
          {isScheduling ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Schedule Recovery Block
            </>
          )}
        </Button>

        {/* Active/Scheduled Blocks */}
        {recoveryBlocks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Recent Recovery Blocks</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recoveryBlocks.slice(0, 5).map((block) => (
                <div key={block.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{block.cluster}</span>
                        <Badge className={`text-xs ${getStatusColor(block.status)}`}>
                          {block.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{block.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {block.duration}m
                    </div>
                    {block.startTime && (
                      <p className="text-[10px] text-muted-foreground">
                        {block.startTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Fatigue Overview */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-2">
            <span>Current Team Fatigue Levels</span>
            <span className="text-primary">Auto-refresh every 30s</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(teamFatigue).slice(0, 6).map(([team, fatigue]) => (
              <div key={team} className="flex items-center justify-between p-1 bg-muted/20 rounded">
                <span className="text-[10px]">{team}</span>
                <span className={`text-[10px] font-mono ${fatigue > 0.7 ? 'text-red-500' : fatigue > 0.4 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {Math.round(fatigue * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
