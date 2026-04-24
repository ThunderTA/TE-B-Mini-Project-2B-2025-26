# CogniSense™

A comprehensive cognitive load monitoring and team insights platform that combines real-time fatigue detection, machine learning analytics, and intelligent workload distribution.

## 🧠 Overview

CogniSense™ is a full-stack web application designed to monitor and analyze cognitive load patterns for individuals and teams. It leverages advanced machine learning models, real-time data processing, and intuitive visualizations to help organizations optimize productivity, prevent burnout, and improve team performance.

## 🏗️ Architecture

The application consists of three main components:

- **Frontend**: React-based dashboard with TypeScript and Tailwind CSS
- **Backend Server**: FastAPI Python server for ML models and data processing
- **Analysis Engine**: Node.js server for dataset processing and comparative analytics

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives
- **React Router** - Client-side routing
- **React Hook Form** - Form management with validation
- **Chart.js & Recharts** - Data visualization libraries
- **MediaPipe** - Face mesh detection for fatigue analysis

### Backend (Python)
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **Scikit-learn** - Machine learning library
- **XGBoost** - Gradient boosting framework
- **Matplotlib & Seaborn** - Data visualization
- **Plotly** - Interactive charts

### Analysis Engine (Node.js)
- **Express.js** - Web application framework
- **Cheerio** - Server-side HTML parsing
- **Node-fetch** - HTTP requests
- **CORS** - Cross-origin resource sharing

## 📦 Dependencies

### Python Dependencies
```txt
fastapi
uvicorn
pandas
numpy
scikit-learn
matplotlib
seaborn
uvicorn[standard]
plotly
xgboost
```

### Node.js Dependencies
Key packages include React ecosystem, UI components, data visualization, and development tools (see `package.json` for complete list).

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn package manager

### Installation Steps

1. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Start the development servers**

**Terminal 1 - Frontend Development Server:**
```bash
npm run dev
```

**Terminal 2 - Python Backend Server:**
```bash
cd server
python app.py
```

**Terminal 3 - Analysis Engine (Node.js):**
```bash
cd analysis
node nserver.js
```

**Terminal 4 - Python Analyzer:**
```bash
cd analysis
python analyzer.py
```

The application will be available at `http://localhost:5173` (or as specified by Vite).

## 🌐 API Endpoints

### Main Backend Server (Python)
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/fatigue/data` - Fatigue monitoring data
- `POST /api/ml/train` - Train ML models
- `GET /api/ml/predict` - Get predictions

### Analysis Engine (Node.js)
- `GET /api/datasets/refresh` - Refresh dataset processing
- `GET /api/research/comparative` - Comparative analysis
- `GET /api/clusters/team` - Team clustering analysis
- `WebSocket /ws/live` - Real-time data streaming

### Python Analyzer
- `GET /api/analyzer/sessions` - Session analysis
- `GET /api/analyzer/clusters` - Clustering results
- `GET /api/analyzer/health` - Service health check

## 📊 Features

### Core Functionality
- **Real-time Fatigue Detection**: Computer vision-based analysis using MediaPipe
- **Cognitive Load Monitoring**: Multi-metric tracking and visualization
- **Team Performance Analytics**: Comparative analysis across teams
- **Predictive Modeling**: ML-based burnout and performance forecasting
- **Workload Distribution**: Intelligent task allocation
- **Recovery Recommendations**: Personalized break suggestions

### Dashboard Components
- **Cognitive Energy Meter**: Real-time cognitive load visualization
- **Fatigue Heatmap**: Team-wide fatigue patterns
- **Burnout Forecast**: Predictive analytics for team burnout
- **Work Balance Monitor**: Workload distribution analysis
- **Team Clusters**: Performance-based team grouping
- **ML Visualization**: Model performance and predictions

## 🔧 Configuration

### Environment Variables
Create environment variables for:
- Database connections
- API keys for external services
- Model file paths
- Server ports

### Default Ports
- Frontend (Vite): `5173`
- Python Backend: `8000`
- Node.js Analysis: `3001`
- Python Analyzer: `8001`

## 📁 Project Structure

```
cognisense-updated/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   └── hooks/             # Custom hooks
├── server/                # Python FastAPI backend
│   ├── app.py            # Main application
│   └── ml_visualization.py # ML visualization
├── analysis/              # Analysis engine
│   ├── nserver.js        # Node.js analysis server
│   ├── analyzer.py       # Python analyzer
│   └── *.js              # Dataset processing scripts
├── datasets/             # Training and test data
├── public/               # Static assets
└── requirements.txt      # Python dependencies
```

## 🧪 Machine Learning Models

The application uses several ML models:
- **Fatigue Detection Model**: Computer vision-based fatigue analysis
- **Cognitive Load Predictor**: Multi-feature regression model
- **Burnout Forecast**: Time-series prediction model
- **Team Clustering**: Unsupervised learning for team grouping

Models are trained on datasets including:
- Mental health metrics
- WFH burnout indicators
- Cloud workload patterns
- Fatigue detection data

## 🔒 Security Features

- JWT-based authentication
- Email verification system
- CORS protection
- Input validation and sanitization
- Session management

## 📈 Performance Monitoring

- Real-time WebSocket connections
- Caching for dataset processing
- Optimized ML model inference
- Lazy loading for dashboard components

## 🚀 Deployment

### Development
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Production
1. Build the frontend: `npm run build`
2. Deploy the `dist/` folder to static hosting
3. Configure backend servers on cloud infrastructure
4. Set up environment variables and database connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🐛 Troubleshooting

### Common Issues
- **Port conflicts**: Ensure all servers use different ports
- **CORS errors**: Verify backend CORS configuration
- **Model loading**: Check model file paths and permissions
- **Dataset processing**: Ensure datasets are properly formatted

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=true
LOG_LEVEL=debug
```

## 📞 Support

For technical support or questions, please refer to the project documentation or contact the development team.
