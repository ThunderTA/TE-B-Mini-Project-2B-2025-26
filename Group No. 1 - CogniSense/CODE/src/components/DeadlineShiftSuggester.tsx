import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotifications } from "@/contexts/NotificationContext";

interface DeadlineSuggestion {
  recommendation: string;
  confidence: number;
  currentFatigue: number;
  suggestedDays: number;
  reasoning: string;
}

export default function DeadlineShiftSuggester() {
  const [suggestion, setSuggestion] = useState<DeadlineSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchDeadlineSuggestion();
    const interval = setInterval(fetchDeadlineSuggestion, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDeadlineSuggestion = async () => {
    try {
      const [respSuggest, respHeatmap] = await Promise.all([
        fetch("/api/deadline_suggest"),
        fetch("/api/heatmap")
      ]);
      const data = await respSuggest.json();
      const heatmap = await respHeatmap.json();

      if (data.recommendation) {
        const suggestedDays = parseInt(data.recommendation.match(/\+(\d+) day/)?.[1] || "0");
        const items = Array.isArray(heatmap?.items) ? heatmap.items : [];
        const avgRisk = items.length > 0 ? (items.reduce((s: number, it: any) => s + (it.risk || 0), 0) / items.length) : 0.5;
        const currentFatigue = Math.round(avgRisk * 100);

        setSuggestion({
          recommendation: data.recommendation,
          confidence: data.confidence,
          currentFatigue,
          suggestedDays,
          reasoning: generateReasoning(currentFatigue, suggestedDays)
        });
      }
    } catch (error) {
      console.error("Failed to fetch deadline suggestion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReasoning = (fatigue: number, days: number): string => {
    if (fatigue > 70) {
      return `High team fatigue detected (${fatigue.toFixed(1)}%). Extending deadline helps prevent burnout and maintain quality.`;
    } else if (fatigue > 50) {
      return `Moderate fatigue levels (${fatigue.toFixed(1)}%). A small extension can improve work-life balance.`;
    } else {
      return `Current fatigue levels are manageable (${fatigue.toFixed(1)}%). No extension needed, but monitoring recommended.`;
    }
  };

  const applySuggestion = async () => {
    if (!suggestion) return;

    try {
      // In a real implementation, this would call an API to update the deadline
      addNotification({
        title: "Deadline Updated",
        message: `Deadline shifted by ${suggestion.suggestedDays} day(s) with ${Math.round(suggestion.confidence * 100)}% confidence.`,
        type: "success"
      });

      // Refresh the suggestion
      fetchDeadlineSuggestion();
    } catch (error) {
      addNotification({
        title: "Failed to Update Deadline",
        message: "Unable to apply deadline suggestion. Please try again.",
        type: "error"
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500 bg-green-50 dark:bg-green-950";
    if (confidence >= 0.6) return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    return "text-red-500 bg-red-50 dark:bg-red-950";
  };

  const getFatigueColor = (fatigue: number) => {
    if (fatigue >= 70) return "text-red-500";
    if (fatigue >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Deadline Shift Analysis
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

  if (!suggestion) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Deadline Shift Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load deadline suggestions. Please check your connection.
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
            <Calendar className="w-4 h-4" />
            Deadline Shift Analysis
          </CardTitle>
          <Badge className={getConfidenceColor(suggestion.confidence)}>
            {Math.round(suggestion.confidence * 100)}% confidence
          </Badge>
        </div>
        <CardDescription>
          AI-powered deadline optimization based on team cognitive load
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Current Fatigue</span>
          </div>
          <span className={`text-sm font-bold ${getFatigueColor(suggestion.currentFatigue)}`}>
            {suggestion.currentFatigue.toFixed(1)}%
          </span>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Recommendation</span>
          </div>
          <p className="text-sm text-foreground">{suggestion.recommendation}</p>
        </div>

        {/* Reasoning */}
        <div className="text-xs text-muted-foreground leading-relaxed">
          {suggestion.reasoning}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {suggestion.suggestedDays > 0 ? (
            <Button 
              onClick={applySuggestion}
              className="flex-1 text-sm"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Suggestion
            </Button>
          ) : (
            <Button 
              variant="outline"
              disabled
              className="flex-1 text-sm"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              No Change Needed
            </Button>
          )}
          <Button 
            variant="ghost"
            onClick={fetchDeadlineSuggestion}
            className="text-sm"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
