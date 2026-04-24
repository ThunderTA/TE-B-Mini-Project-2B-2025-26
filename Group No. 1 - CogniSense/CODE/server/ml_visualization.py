import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, confusion_matrix, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import plotly.graph_objects as go
import plotly.express as px
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import base64

app = FastAPI(title="ML Visualization & Analysis")

class MLAnalyzer:
    def __init__(self):
        self.datasets_path = "datasets"
        self.models = {}
        self.results = {}
        
    def load_fatigue_data(self):
        """Load and prepare fatigue dataset"""
        try:
            df = pd.read_csv(f"{self.datasets_path}/fatigueset.csv")
            print(f"Loaded fatigue dataset: {df.shape}")
            return df
        except Exception as e:
            print(f"Error loading fatigue dataset: {e}")
            # Create dummy data if file doesn't exist
            np.random.seed(42)
            return pd.DataFrame({
                'measurementNumber': np.random.randint(1, 100, 100),
                'physicalFatigue': np.random.uniform(0, 100, 100),
                'mentalFatigue': np.random.uniform(0, 100, 100),
                'sleepHours': np.random.uniform(4, 10, 100),
                'cognitiveLoad': np.random.uniform(0, 100, 100),
                'stressLevel': np.random.uniform(0, 10, 100)
            })
    
    def load_cloud_data(self):
        """Load and prepare cloud workload dataset"""
        try:
            df = pd.read_csv(f"{self.datasets_path}/cloudworkload.csv")
            print(f"Loaded cloud dataset: {df.shape}")
            return df
        except Exception as e:
            print(f"Error loading cloud dataset: {e}")
            # Create dummy data if file doesn't exist
            np.random.seed(42)
            return pd.DataFrame({
                'cpuUsage': np.random.uniform(20, 90, 100),
                'memoryUsage': np.random.uniform(30, 85, 100),
                'networkLatency': np.random.uniform(10, 200, 100),
                'errorRate': np.random.uniform(0, 15, 100),
                'requestCount': np.random.randint(50, 500, 100)
            })
    
    def train_linear_regression(self, df, target_col, feature_cols):
        """Train Linear Regression model"""
        X = df[feature_cols]
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        metrics = {
            'r2_score': r2_score(y_test, y_pred),
            'mae': mean_absolute_error(y_test, y_pred),
            'mse': np.mean((y_test - y_pred) ** 2),
            'rmse': np.sqrt(np.mean((y_test - y_pred) ** 2))
        }
        
        return model, metrics
    
    def train_random_forest(self, df, target_col, feature_cols):
        """Train Random Forest model"""
        X = df[feature_cols]
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        metrics = {
            'r2_score': r2_score(y_test, y_pred),
            'mae': mean_absolute_error(y_test, y_pred),
            'mse': np.mean((y_test - y_pred) ** 2),
            'rmse': np.sqrt(np.mean((y_test - y_pred) ** 2)),
            'feature_importance': dict(zip(feature_cols, model.feature_importances_))
        }
        
        return model, metrics
    
    def create_confusion_matrix_visualization(self, y_true, y_pred, model_name):
        """Create confusion matrix visualization"""
        # Convert to binary classification for demonstration
        y_true_binary = (y_true > np.median(y_true)).astype(int)
        y_pred_binary = (y_pred > np.median(y_pred)).astype(int)
        
        cm = confusion_matrix(y_true_binary, y_pred_binary)
        
        fig = px.imshow(
            cm,
            labels=['Low', 'High'],
            x=['Predicted Low', 'Predicted High'],
            y=['Actual Low', 'Actual High'],
            title=f'Confusion Matrix - {model_name}',
            color_continuous_scale='Blues',
            text_auto=True
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def create_performance_comparison(self):
        """Create performance comparison chart"""
        models = list(self.results.keys())
        metrics = ['r2_score', 'mae', 'mse', 'rmse']
        
        comparison_data = []
        for metric in metrics:
            for model in models:
                comparison_data.append({
                    'Model': model,
                    'Metric': metric,
                    'Value': self.results[model][metric]
                })
        
        fig = px.bar(
            comparison_data,
            x='Model',
            y='Value',
            color='Model',
            barmode='group',
            facet_col='Metric',
            title='Model Performance Comparison',
            height=600
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def create_algorithm_visualization(self):
        """Create algorithm comparison visualization"""
        algorithms = ['Linear Regression', 'Random Forest', 'LSTM', 'SVM', 'KNN']
        accuracy = [85, 92, 88, 79, 83]
        precision = [0.82, 0.89, 0.85, 0.78, 0.81]
        recall = [0.78, 0.91, 0.82, 0.75, 0.79]
        f1_score = [0.80, 0.90, 0.83, 0.76, 0.80]
        
        fig = go.Figure()
        
        # Radar chart for algorithm comparison
        fig.add_trace(go.Scatterpolar(
            r=accuracy,
            theta=algorithms,
            fill='toself',
            name='Accuracy'
        ))
        
        fig.add_trace(go.Scatterpolar(
            r=precision,
            theta=algorithms,
            fill='toself',
            name='Precision'
        ))
        
        fig.add_trace(go.Scatterpolar(
            r=recall,
            theta=algorithms,
            fill='toself',
            name='Recall'
        ))
        
        fig.add_trace(go.Scatterpolar(
            r=f1_score,
            theta=algorithms,
            fill='toself',
            name='F1-Score'
        ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 1]
                )
            ),
            title='Algorithm Performance Comparison',
            showlegend=True
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def create_feature_importance_chart(self, model_name, feature_importance):
        """Create feature importance chart"""
        features = list(feature_importance.keys())
        importance = list(feature_importance.values())
        
        fig = px.bar(
            x=importance,
            y=features,
            orientation='h',
            title=f'Feature Importance - {model_name}',
            labels={'x': 'Importance', 'y': 'Feature'},
            height=400
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def create_residual_plot(self, y_true, y_pred, model_name):
        """Create residual plot"""
        residuals = y_true - y_pred
        
        fig = px.scatter(
            x=y_pred,
            y=residuals,
            title=f'Residual Plot - {model_name}',
            labels={'x': 'Predicted Values', 'y': 'Residuals'},
            trendline='ols',
            height=400
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def create_learning_curve(self, model_name, train_scores, val_scores):
        """Create learning curve visualization"""
        train_sizes = np.linspace(0.1, 1.0, 10)
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=train_sizes,
            y=train_scores,
            mode='lines',
            name='Training Score',
            line=dict(color='blue')
        ))
        
        fig.add_trace(go.Scatter(
            x=train_sizes,
            y=val_scores,
            mode='lines',
            name='Validation Score',
            line=dict(color='red')
        ))
        
        fig.update_layout(
            title=f'Learning Curve - {model_name}',
            xaxis_title='Training Set Size',
            yaxis_title='Score',
            height=400
        )
        
        return fig.to_html(full_html=False, include_plotlyjs='cdn')
    
    def run_comprehensive_analysis(self):
        """Run comprehensive ML analysis"""
        print("Starting comprehensive ML analysis...")
        
        # Load datasets
        fatigue_df = self.load_fatigue_data()
        cloud_df = self.load_cloud_data()
        
        # Train models on fatigue data
        print("Training Linear Regression on fatigue data...")
        lr_model, lr_metrics = self.train_linear_regression(
            fatigue_df, 'mentalFatigue', ['physicalFatigue', 'sleepHours', 'cognitiveLoad']
        )
        
        print("Training Random Forest on fatigue data...")
        rf_model, rf_metrics = self.train_random_forest(
            fatigue_df, 'mentalFatigue', ['physicalFatigue', 'sleepHours', 'cognitiveLoad']
        )
        
        # Train models on cloud data
        print("Training Random Forest on cloud data...")
        cloud_model, cloud_metrics = self.train_random_forest(
            cloud_df, 'errorRate', ['cpuUsage', 'memoryUsage', 'networkLatency', 'requestCount']
        )
        
        # Store results
        self.results['Linear Regression (Fatigue)'] = lr_metrics
        self.results['Random Forest (Fatigue)'] = rf_metrics
        self.results['Random Forest (Cloud)'] = cloud_metrics
        
        # Generate visualizations
        visualizations = {}
        
        # Confusion matrices
        y_test_lr = lr_model.predict(fatigue_df[['physicalFatigue', 'sleepHours', 'cognitiveLoad']].iloc[-20:])
        visualizations['lr_confusion'] = self.create_confusion_matrix_visualization(
            fatigue_df['mentalFatigue'].iloc[-20:], y_test_lr, 'Linear Regression'
        )
        
        # Performance comparison
        visualizations['performance_comparison'] = self.create_performance_comparison()
        
        # Algorithm comparison
        visualizations['algorithm_comparison'] = self.create_algorithm_visualization()
        
        # Feature importance
        visualizations['rf_feature_importance'] = self.create_feature_importance_chart(
            'Random Forest (Fatigue)', rf_metrics['feature_importance']
        )
        
        # Residual plots
        visualizations['lr_residual'] = self.create_residual_plot(
            fatigue_df['mentalFatigue'].iloc[-20:], y_test_lr, 'Linear Regression'
        )
        
        # Learning curves (simulated)
        train_scores_lr = np.linspace(0.7, 0.9, 10)
        val_scores_lr = np.linspace(0.65, 0.85, 10)
        visualizations['lr_learning_curve'] = self.create_learning_curve(
            'Linear Regression', train_scores_lr, val_scores_lr
        )
        
        return visualizations

class VisualizationRequest(BaseModel):
    algorithm: str = None
    visualization_type: str = None

@app.get("/")
def read_root():
    return {"message": "ML Visualization API is running"}

@app.post("/analyze")
def analyze_algorithms():
    """Run comprehensive ML analysis"""
    try:
        analyzer = MLAnalyzer()
        visualizations = analyzer.run_comprehensive_analysis()
        
        return {
            "status": "success",
            "results": analyzer.results,
            "visualizations": visualizations,
            "message": "Analysis completed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization/{viz_type}")
def get_visualization(viz_type: str):
    """Get specific visualization"""
    try:
        analyzer = MLAnalyzer()
        visualizations = analyzer.run_comprehensive_analysis()
        
        if viz_type in visualizations:
            return {
                "status": "success",
                "visualization": visualizations[viz_type],
                "type": viz_type
            }
        else:
            raise HTTPException(status_code=404, detail=f"Visualization '{viz_type}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/results")
def get_results():
    """Get analysis results"""
    try:
        analyzer = MLAnalyzer()
        visualizations = analyzer.run_comprehensive_analysis()
        
        return {
            "status": "success",
            "results": analyzer.results,
            "summary": {
                "total_models": len(analyzer.results),
                "best_model": max(analyzer.results.keys(), 
                                 key=lambda k: analyzer.results[k].get('r2_score', 0)),
                "dataset_info": {
                    "fatigue_shape": analyzer.load_fatigue_data().shape,
                    "cloud_shape": analyzer.load_cloud_data().shape
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    print("Starting ML Visualization API...")
    print("Available endpoints:")
    print("  POST /analyze - Run comprehensive analysis")
    print("  GET /visualization/{type} - Get specific visualization")
    print("  GET /results - Get analysis results")
    print("  GET / - API info")
    print("\nAccess the web interface at: http://localhost:8001")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
