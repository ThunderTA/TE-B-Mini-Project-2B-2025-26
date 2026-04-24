import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart3, Radar, TrendingUp, Activity, Zap } from "lucide-react";

interface ModelResults {
  [modelName: string]: {
    r2_score: number;
    mae: number;
    mse: number;
    rmse: number;
    feature_importance?: { [feature: string]: number };
  };
}

interface VisualizationData {
  [key: string]: string;
}

export default function MLVisualization() {
  const [results, setResults] = useState<ModelResults | null>(null);
  const [visualizations, setVisualizations] = useState<VisualizationData | null>(null);
  const [selectedViz, setSelectedViz] = useState<string>("performance_comparison");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
    fetchVisualizations();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch("http://localhost:8001/results");
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Failed to fetch results");
      console.error(err);
    }
  };

  const fetchVisualizations = async () => {
    try {
      const response = await fetch("http://localhost:8001/visualization/performance_comparison");
      const data = await response.json();
      setVisualizations(data.visualization);
    } catch (err) {
      setError("Failed to fetch visualizations");
      console.error(err);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setResults(data.results);
        setVisualizations(data.visualizations);
      } else {
        setError("Analysis failed");
      }
    } catch (err) {
      setError("Failed to run analysis");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisualization = () => {
    if (!visualizations || !selectedViz) return null;
    return visualizations[selectedViz];
  };

  const getBestModel = () => {
    if (!results) return null;
    
    let bestModel = "";
    let bestScore = -1;
    
    Object.entries(results).forEach(([modelName, metrics]) => {
      if (metrics.r2_score > bestScore) {
        bestScore = metrics.r2_score;
        bestModel = modelName;
      }
    });
    
    return { model: bestModel, score: bestScore };
  };

  const getModelColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.8) return "text-yellow-600";
    if (score >= 0.7) return "text-orange-600";
    return "text-red-600";
  };

  const formatMetric = (value: number, metric: string) => {
    if (metric === "r2_score") return (value * 100).toFixed(1) + "%";
    if (metric === "mae") return value.toFixed(3);
    if (metric === "mse") return value.toFixed(3);
    if (metric === "rmse") return value.toFixed(3);
    return value.toFixed(3);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ML Algorithm Analysis & Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Control Panel */}
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
              <Button 
                onClick={runAnalysis} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Running Analysis...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Complete Analysis</span>
                  </>
                )}
              </Button>
              
              <Select value={selectedViz} onValueChange={setSelectedViz}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance_comparison">Performance Comparison</SelectItem>
                  <SelectItem value="algorithm_comparison">Algorithm Comparison</SelectItem>
                  <SelectItem value="lr_confusion">Confusion Matrix</SelectItem>
                  <SelectItem value="rf_feature_importance">Feature Importance</SelectItem>
                  <SelectItem value="lr_residual">Residual Plot</SelectItem>
                  <SelectItem value="lr_learning_curve">Learning Curve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Error: {error}</p>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Model Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(results).map(([modelName, metrics]) => (
                        <div key={modelName} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{modelName}</h4>
                            <Badge variant={metrics.r2_score >= 0.8 ? "default" : "secondary"}>
                              {metrics.r2_score >= 0.8 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">R² Score:</span>
                              <span className={`font-mono font-bold ${getModelColor(metrics.r2_score)}`}>
                                {formatMetric(metrics.r2_score, "r2_score")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">MAE:</span>
                              <span className="font-mono font-bold">
                                {formatMetric(metrics.mae, "mae")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">MSE:</span>
                              <span className="font-mono font-bold">
                                {formatMetric(metrics.mse, "mse")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">RMSE:</span>
                              <span className="font-mono font-bold">
                                {formatMetric(metrics.rmse, "rmse")}
                              </span>
                            </div>
                          </div>
                          
                          {/* Feature Importance */}
                          {metrics.feature_importance && (
                            <div className="mt-4">
                              <h5 className="font-medium mb-2">Feature Importance:</h5>
                              <div className="space-y-2">
                                {Object.entries(metrics.feature_importance)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                  .map(([feature, importance]) => (
                                    <div key={feature} className="flex items-center justify-between">
                                      <span className="text-sm">{feature}:</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-muted rounded-full h-2">
                                          <div 
                                            className="bg-primary h-2 rounded-full" 
                                            style={{ width: `${importance * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-mono">{(importance * 100).toFixed(1)}%</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Best Model Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Best Performing Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const best = getBestModel();
                      return best ? (
                        <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-2xl font-bold text-green-800 mb-2">
                            {best.model}
                          </div>
                          <div className="text-lg text-green-700">
                            R² Score: {best.score.toFixed(3)}
                          </div>
                          <div className="text-sm text-green-600">
                            Best performing model based on R² score
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-muted rounded-lg">
                          <div className="text-muted-foreground">
                            No results available. Run analysis first.
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Visualization Display */}
            {visualizations && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Algorithm Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="w-full h-96 border rounded-lg" 
                      dangerouslySetInnerHTML={{ __html: getVisualization() || "" }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
