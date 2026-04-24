import { useState, useEffect } from "react";
import { ArrowRightLeft, Users, TrendingDown, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotifications } from "@/contexts/NotificationContext";

interface WorkloadMove {
  task: string;
  from: string;
  to: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

interface AutoDistributeResponse {
  moves: WorkloadMove[];
  status: string;
}

export default function AutoDistributeWorkload() {
  const [distribution, setDistribution] = useState<AutoDistributeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchDistribution();
    const interval = setInterval(fetchDistribution, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDistribution = async () => {
    try {
      const response = await fetch("/api/auto_distribute");
      const data = await response.json();
      setDistribution(data);
    } catch (error) {
      console.error("Failed to fetch auto-distribute suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyDistribution = async () => {
    if (!distribution) return;

    setIsApplying(true);
    try {
      // Simulate API call to apply distribution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        title: "Workload Distributed Successfully",
        message: `${distribution.moves.length} tasks redistributed across teams.`,
        type: "success"
      });

      // Refresh the distribution
      fetchDistribution();
    } catch (error) {
      addNotification({
        title: "Distribution Failed",
        message: "Unable to apply workload distribution. Please try again.",
        type: "error"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      "Design": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Research": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Infra": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "QA": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Eng-B": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "PM": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[team] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Auto-Distribute Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!distribution || distribution.moves.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Auto-Distribute Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Current workload is optimally distributed. No redistribution needed at this time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Auto-Distribute Workload
          </CardTitle>
          <Badge variant="secondary">
            {distribution.moves.length} moves
          </Badge>
        </div>
        <CardDescription>
          AI-powered workload balancing to prevent team burnout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution Moves */}
        <div className="space-y-3">
          {distribution.moves.map((move, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{move.task}</span>
                </div>
                <Badge className={getImpactColor(move.impact)}>
                  {move.impact} impact
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getTeamColor(move.from)}>
                  {move.from}
                </Badge>
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                <Badge className={getTeamColor(move.to)}>
                  {move.to}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground">{move.reason}</p>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
          <TrendingDown className="w-4 h-4 text-primary" />
          <span className="text-xs text-primary">
            Expected reduction in team overload: ~15-25%
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={applyDistribution}
            disabled={isApplying}
            className="flex-1 text-sm"
            size="sm"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Distribution
              </>
            )}
          </Button>
          <Button 
            variant="ghost"
            onClick={fetchDistribution}
            className="text-sm"
            size="sm"
          >
            Refresh
          </Button>
        </div>

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This action will reassign tasks between teams. Team leads will be notified automatically.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
