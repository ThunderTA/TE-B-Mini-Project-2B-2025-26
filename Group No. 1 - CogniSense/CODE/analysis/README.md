# Analysis Module — CogniSense

## Project Info
- Purpose: Comparative research analysis and interactive visualization for cognitive workload, fatigue, and planning.
- Scope: Processes datasets in `../datasets/`, computes dataset characteristics, and exposes a backend powering the `index.html` UI.
- Audience: Researchers and engineers exploring algorithm suitability for cognitive analytics.

## Tech Stack
- Frontend: Vanilla HTML/CSS, Chart.js
- Backend: Node.js (Express), simple CSV parsing
- Data: CSVs under `../datasets/fatigueset/**` (HR, EDA, BVP, self-reports)

## Architecture & Data Flow
- Data ingestion: `dataset_pipeline.js` scans `../datasets/fatigueset`, parses CSVs, aggregates time-series by minute, and builds subject/session summaries.
- Feature extraction: Computes lag-1 autocorrelation, basic smoothing errors, and clustering metrics (k-means + silhouette).
- Comparative scoring: Translates dataset characteristics into algorithm suitability scores for four domains:
  - Cognitive workload & burnout: LSTM, GRU, BiLSTM, TCN, Transformer, ARIMA.
  - Mental fatigue modeling: Bayesian Network, Dynamic BN, HMM, MDP, CRF, FLS.
  - Team fatigue heatmaps: K-Means, Hierarchical, DBSCAN, GMM, Spectral, Federated.
  - Task distribution & meetings: GA, PSO, ACO, SA, DE, NSGA-II.
- Backend API: `nserver.js` loads the pipeline and serves:
  - `GET /api/datasets/refresh` — reprocesses datasets and returns high-level stats.
  - `GET /api/research/comparative` — returns dataset stats, cluster summary, and per-domain scores.
- UI: `index.html` offers two modes:
  - Traffic Prediction (existing demo), using `multi_algo_prediction_model.js`.
  - Comparative/Research Analysis (new), fetching from `/api/research/comparative` and visualizing via radar charts and tables.

## Core Features
- Automatic dataset processing from the `datasets` folder.
- Comparative research mode with domain-specific algorithm scorecards.
- Radar charts and tables per domain for quick visual benchmarking.
- Refresh endpoint to re-run the pipeline without restarting the server.

## Local Development
1. Ensure Node.js 18+ is installed.
2. From this `analysis/` directory, install required packages if needed:
   - `npm i express cors node-fetch@2 cheerio` (or use your project’s root environment).
3. Start the backend server:
   - `node nserver.js`
4. Open the UI:
   - Visit `http://localhost:3000/analysis/index.html` or open `analysis/index.html` via the server’s static hosting.
5. Reprocess datasets on demand:
   - `GET http://localhost:3000/api/datasets/refresh`

## Notes
- The comparative scores are heuristic, derived from dataset statistics, intended for research benchmarking and UI integration.
- Extend `dataset_pipeline.js` to compute richer features and plug in model training as needed.
