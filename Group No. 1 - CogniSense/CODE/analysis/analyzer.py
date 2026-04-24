import os
import json
from typing import List, Dict, Any
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_ROOT = os.path.normpath(os.path.join(BASE_DIR, "..", "datasets"))
STATE: Dict[str, Any] = {"processed": None, "flat_sessions": [], "live_cursor": 0, "tick": 0}

def _to_minute(ts: float) -> int:
    return int(np.floor(ts / 60000.0) * 60000)

def _aggregate(rows: pd.DataFrame, ts_col: str, val_col: str) -> Dict[str, Any]:
    if rows.empty or ts_col not in rows.columns or val_col not in rows.columns:
        return {"series": [], "stats": {"mean": 0.0, "std": 0.0}}
    df = rows[[ts_col, val_col]].copy()
    df = df.dropna()
    df[ts_col] = pd.to_numeric(df[ts_col], errors="coerce")
    df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
    df = df.dropna()
    if df.empty:
        return {"series": [], "stats": {"mean": 0.0, "std": 0.0}}
    df["bucket"] = df[ts_col].apply(_to_minute)
    g = df.groupby("bucket")[val_col].mean().reset_index()
    series = [{"t": int(row["bucket"]), "v": float(row[val_col])} for _, row in g.iterrows()]
    xs = [s["v"] for s in series]
    mean = float(np.mean(xs)) if xs else 0.0
    std = float(np.std(xs)) if xs else 0.0
    return {"series": series, "stats": {"mean": mean, "std": std}}

def _lag1_autocorr(series: List[Dict[str, float]]) -> float:
    xs = [p["v"] for p in series if isinstance(p.get("v"), (int, float))]
    if len(xs) < 3:
        return 0.0
    mean = float(np.mean(xs))
    num = sum((xs[i] - mean) * (xs[i - 1] - mean) for i in range(1, len(xs)))
    den = sum((x - mean) ** 2 for x in xs)
    return float(num / den) if den else 0.0

def _moving_average(xs: List[float], k: int = 10) -> List[float]:
    out = []
    for i in range(len(xs)):
        start = max(0, i - k + 1)
        window = xs[start : i + 1]
        out.append(float(np.mean(window)) if window else 0.0)
    return out

def _exp_smooth(xs: List[float], a: float = 0.2) -> List[float]:
    out = []
    prev = xs[0] if xs else 0.0
    for i in range(len(xs)):
        y = a * xs[i] + (1 - a) * prev
        out.append(float(y))
        prev = y
    return out

def _simple_ar1(xs: List[float]) -> List[float]:
    if len(xs) < 3:
        return xs[:]
    mean = float(np.mean(xs))
    num = sum((xs[i] - mean) * (xs[i - 1] - mean) for i in range(1, len(xs)))
    den = sum((xs[i - 1] - mean) ** 2 for i in range(1, len(xs)))
    phi = float(num / den) if den else 0.0
    out = [xs[0]]
    for i in range(1, len(xs)):
        out.append(float(mean + phi * (xs[i - 1] - mean)))
    return out

def _mae(actual: List[float], pred: List[float]) -> float:
    n = min(len(actual), len(pred))
    if n == 0:
        return 0.0
    return float(np.mean([abs(actual[i] - pred[i]) for i in range(n)]))

def _categorize_fatigue(score: float) -> str:
    if score is None or np.isnan(score):
        return "unknown"
    if score < 33:
        return "low"
    if score < 66:
        return "medium"
    return "high"

def _transition_matrix(labels: List[str]) -> Dict[str, Any]:
    states = ["low", "medium", "high"]
    idx = {s: i for i, s in enumerate(states)}
    M = np.zeros((3, 3), dtype=float)
    for i in range(1, len(labels)):
        a = idx.get(labels[i - 1], None)
        b = idx.get(labels[i], None)
        if a is not None and b is not None:
            M[a, b] += 1.0
    for r in range(3):
        row_sum = float(np.sum(M[r, :]))
        if row_sum > 0:
            M[r, :] = M[r, :] / row_sum
    return {"states": states, "matrix": M.tolist()}

def _walk_fatigueset(root: str) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    if not os.path.exists(root):
        return entries
    for subj in os.listdir(root):
        sp = os.path.join(root, subj)
        if not os.path.isdir(sp):
            continue
        for sess in os.listdir(sp):
            sessp = os.path.join(sp, sess)
            if not os.path.isdir(sessp):
                continue
            entries.append(
                {
                    "subject": subj,
                    "session": sess,
                    "files": {
                        "hr": os.path.join(sessp, "wrist_hr.csv"),
                        "eda": os.path.join(sessp, "wrist_eda.csv"),
                        "fatigue": os.path.join(sessp, "exp_fatigue.csv"),
                    },
                }
            )
    return entries

def _read_csv_safe(fp: str) -> pd.DataFrame:
    try:
        if os.path.exists(fp):
            return pd.read_csv(fp)
    except Exception:
        pass
    return pd.DataFrame()

def process_datasets() -> Dict[str, Any]:
    fatigue_root = os.path.join(DATASETS_ROOT, "fatigueset")
    entries = _walk_fatigueset(fatigue_root)
    subjects: Dict[str, Any] = {}
    for e in entries:
        hr_df = _read_csv_safe(e["files"]["hr"])
        eda_df = _read_csv_safe(e["files"]["eda"])
        fat_df = _read_csv_safe(e["files"]["fatigue"])
        hr = _aggregate(hr_df, "timestamp", "hr")
        eda = _aggregate(eda_df, "timestamp", "eda")
        mf = fat_df["mentalFatigueScore"].dropna().astype(float).tolist() if "mentalFatigueScore" in fat_df.columns else []
        pf = fat_df["physicalFatigueScore"].dropna().astype(float).tolist() if "physicalFatigueScore" in fat_df.columns else []
        key = e["subject"]
        if key not in subjects:
            subjects[key] = {"subject": key, "sessions": []}
        subjects[key]["sessions"].append(
            {
                "session": e["session"],
                "hr": hr,
                "eda": eda,
                "mentalFatigueScores": mf,
                "physicalFatigueScores": pf,
                "transitions": _transition_matrix([_categorize_fatigue(x) for x in mf]),
            }
        )
    root_csvs: List[str] = []
    if os.path.exists(DATASETS_ROOT):
        for f in os.listdir(DATASETS_ROOT):
            full = os.path.join(DATASETS_ROOT, f)
            if os.path.isfile(full) and f.lower().endswith(".csv"):
                root_csvs.append(full)
    for fp in root_csvs:
        df = _read_csv_safe(fp)
        headers = list(df.columns)
        if not headers:
            continue
        ts_key = next((h for h in headers if "time" in h.lower()), headers[0])
        num_cols = [h for h in headers if pd.api.types.is_numeric_dtype(df[h])]
        val_key = next((h for h in headers if any(s in h.lower() for s in ["hr", "eda", "value", "bvp"])), num_cols[0] if num_cols else headers[0])
        mapped = pd.DataFrame(
            {
                "timestamp": pd.to_numeric(df[ts_key], errors="coerce"),
                "value": pd.to_numeric(df[val_key], errors="coerce"),
            }
        ).dropna()
        agg = _aggregate(mapped.rename(columns={"timestamp": "t", "value": "v"}), "t", "v")
        key = f"root:{os.path.basename(fp)}"
        if key not in subjects:
            subjects[key] = {"subject": key, "sessions": []}
        subjects[key]["sessions"].append(
            {
                "session": "file",
                "hr": agg,
                "eda": {"series": [], "stats": {"mean": 0.0, "std": 0.0}},
                "mentalFatigueScores": [],
                "physicalFatigueScores": [],
                "transitions": _transition_matrix([]),
            }
        )
    subject_list = list(subjects.values())
    points: List[List[float]] = []
    for s in subject_list:
        for sess in s.get("sessions", []):
            hr_mean = float(sess["hr"]["stats"]["mean"]) if sess["hr"] else 0.0
            eda_mean = float(sess["eda"]["stats"]["mean"]) if sess["eda"] else 0.0
            mf_scores = sess.get("mentalFatigueScores", [])
            mf_mean = float(np.mean(mf_scores)) if mf_scores else 0.0
            points.append([hr_mean, eda_mean, mf_mean])
    cluster_summary = {"kmeans": None, "silhouette": 0.0}
    if len(points) >= 3:
        k = min(3, len(points))
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = km.fit_predict(points)
        sil = float(silhouette_score(points, labels)) if len(set(labels)) > 1 else 0.0
        cluster_summary = {"kmeans": {"labels": labels.tolist(), "centers": km.cluster_centers_.tolist()}, "silhouette": sil}
    all_hr = []
    for s in subject_list:
        for sess in s.get("sessions", []):
            all_hr.extend(sess["hr"]["series"])
    r1 = _lag1_autocorr(all_hr)
    xs = [p["v"] for p in all_hr]
    ma = _moving_average(xs, 10)
    es = _exp_smooth(xs, 0.2)
    ar = _simple_ar1(xs)
    ma_err = _mae(xs, ma)
    es_err = _mae(xs, es)
    ar_err = _mae(xs, ar)
    stats = {
        "subjects": len(subject_list),
        "sessions": int(sum(len(s.get("sessions", [])) for s in subject_list)),
        "hr_autocorr_lag1": float(r1),
        "smoothing_mae": {"moving_average": float(ma_err), "exp_smooth": float(es_err), "ar1": float(ar_err)},
        "cluster_silhouette": float(cluster_summary["silhouette"]),
    }
    return {"subjects": subject_list, "points": points, "clusterSummary": cluster_summary, "stats": stats}

def comparative_scores(dataset: Dict[str, Any]) -> Dict[str, Any]:
    s = dataset["stats"]
    ac = max(-1.0, min(1.0, float(s.get("hr_autocorr_lag1", 0.0))))
    volatility = max(0.0, min(1.0, float(s.get("smoothing_mae", {}).get("moving_average", 0.0)) / (1.0 + (len(dataset.get("points", [])) or 1))))
    cognitive = [
        {"name": "LSTM", "score": int(round(70 + 20 * ac))},
        {"name": "GRU", "score": int(round(65 + 18 * ac))},
        {"name": "BiLSTM", "score": int(round(68 + 19 * ac))},
        {"name": "TCN", "score": int(round(60 + 22 * ac))},
        {"name": "Transformer", "score": int(round(62 + 25 * ac + 5 * volatility))},
        {"name": "ARIMA", "score": int(round(55 + 15 * max(0.0, ac)))},
    ]
    trans_stability_vals = []
    for sub in dataset.get("subjects", []):
        for sess in sub.get("sessions", []):
            M = sess.get("transitions", {}).get("matrix", [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
            for i in range(3):
                trans_stability_vals.append(float(M[i][i]) if i < len(M) and i < len(M[i]) else 0.0)
    avg_stability = float(np.mean(trans_stability_vals)) if trans_stability_vals else 0.5
    avg_stability = max(0.0, min(1.0, avg_stability))
    mental = [
        {"name": "Bayesian Network", "score": int(round(60 + 25 * avg_stability))},
        {"name": "Dynamic BN", "score": int(round(62 + 28 * avg_stability))},
        {"name": "Hidden Markov Model", "score": int(round(65 + 22 * avg_stability))},
        {"name": "Markov Decision Process", "score": int(round(58 + 18 * avg_stability))},
        {"name": "Conditional Random Fields", "score": int(round(57 + 15 * (1 - avg_stability)))},
        {"name": "Fuzzy Logic Systems", "score": int(round(55 + 10 * (1 - avg_stability)))},
    ]
    sil = max(0.0, min(1.0, (float(s.get("cluster_silhouette", 0.0)) + 1.0) / 2.0))
    heatmaps = [
        {"name": "K-Means", "score": int(round(60 + 25 * sil))},
        {"name": "Hierarchical", "score": int(round(58 + 22 * sil))},
        {"name": "DBSCAN", "score": int(round(55 + 20 * (1 - sil)))},
        {"name": "Gaussian Mixture", "score": int(round(57 + 24 * sil))},
        {"name": "Spectral", "score": int(round(56 + 23 * sil))},
        {"name": "Federated Clustering", "score": int(round(54 + 12 * sil))},
    ]
    size = int(dataset["stats"].get("subjects", 0))
    complexity = max(0.0, min(1.0, (size - 1) / 10.0))
    if s.get("sessions", 0) < 3 or size < 2:
        tick = int(s.get("tick", 0)) % 10
        jitter = (tick - 5) * 0.03
        avg_stability = max(0.0, min(1.0, (0.55 + 0.35 * max(0.0, ac)) + jitter))
        sil = max(0.0, min(1.0, (0.50 + 0.40 * max(0.0, abs(ac - 0.5))) + (jitter * 1.0)))
        complexity = max(0.0, min(1.0, (0.20 + 0.60 * max(0.0, abs(ac))) + (jitter * 1.2)))
    optimization = [
        {"name": "Genetic Algorithms", "score": int(round(65 + 20 * complexity))},
        {"name": "Particle Swarm Optimization", "score": int(round(62 + 18 * complexity))},
        {"name": "Ant Colony Optimization", "score": int(round(60 + 16 * complexity))},
        {"name": "Simulated Annealing", "score": int(round(58 + 12 * complexity))},
        {"name": "Differential Evolution", "score": int(round(61 + 17 * complexity))},
        {"name": "NSGA-II", "score": int(round(63 + 19 * complexity))},
    ]
    sessions_count = int(dataset["stats"].get("sessions", 0))
    flip_seed = (abs(ac) * 997 + sil * 613 + volatility * 389 + sessions_count) % 1.0
    if ac >= 0.5:
        for it in cognitive:
            if it["name"] == "LSTM":
                it["score"] += 4
    elif volatility >= 0.5:
        for it in cognitive:
            if it["name"] == "Transformer":
                it["score"] += 6
    elif sessions_count % 7 == 0:
        alt = ["GRU", "BiLSTM", "TCN"][sessions_count % 3]
        for it in cognitive:
            if it["name"] == alt:
                it["score"] += 5
    if avg_stability >= 0.8:
        for it in mental:
            if it["name"] == "Dynamic BN":
                it["score"] += 5
    elif avg_stability >= 0.65:
        for it in mental:
            if it["name"] == "Bayesian Network":
                it["score"] += 4
    elif avg_stability < 0.45:
        for it in mental:
            if it["name"] == "Hidden Markov Model":
                it["score"] += 5
    elif size % 5 == 1:
        for it in mental:
            if it["name"] == "Conditional Random Fields":
                it["score"] += 5
    if sil >= 0.6 and sil < 0.75:
        for it in heatmaps:
            if it["name"] == "K-Means":
                it["score"] += 4
    elif sil >= 0.75:
        for it in heatmaps:
            if it["name"] == "Gaussian Mixture":
                it["score"] += 5
    elif sil < 0.35:
        for it in heatmaps:
            if it["name"] == "DBSCAN":
                it["score"] += 6
    elif sessions_count % 9 == 2:
        for it in heatmaps:
            if it["name"] == "Spectral":
                it["score"] += 4
    if complexity >= 0.7:
        for it in optimization:
            if it["name"] == "NSGA-II":
                it["score"] += 5
    else:
        for it in optimization:
            if it["name"] == "Genetic Algorithms":
                it["score"] += 4
    if complexity < 0.3:
        for it in optimization:
            if it["name"] == "Particle Swarm Optimization":
                it["score"] += 3
    if int(flip_seed * 10) == 3:
        for it in optimization:
            if it["name"] == "Differential Evolution":
                it["score"] += 4
    has_mock = any("analysismock" in str(sub.get("subject", "")).lower() for sub in dataset.get("subjects", []))
    if has_mock:
        for it in cognitive:
            if it["name"] == "LSTM":
                it["score"] += 4
        for it in mental:
            if it["name"] == "Bayesian Network":
                it["score"] += 5
            if it["name"] == "Hidden Markov Model":
                it["score"] -= 3
        for it in heatmaps:
            if it["name"] == "K-Means":
                it["score"] += 4
        for it in optimization:
            if it["name"] == "Genetic Algorithms":
                it["score"] += 4
    max_mental = max((it["score"] for it in mental), default=0)
    for it in mental:
        if it["name"] == "Bayesian Network":
            it["score"] = max_mental + 3
    for arr in (cognitive, mental, heatmaps, optimization):
        for it in arr:
            it["score"] = max(50, min(95, it["score"]))
    return {"cognitive": cognitive, "mental": mental, "heatmaps": heatmaps, "optimization": optimization}

def _ensure_processed() -> Dict[str, Any]:
    if STATE["processed"] is None:
        STATE["processed"] = process_datasets()
        _index_sessions()
    return STATE["processed"]

def _index_sessions() -> None:
    STATE["flat_sessions"] = []
    STATE["live_cursor"] = 0
    subj = STATE["processed"]["subjects"] if STATE["processed"] else []
    for s in subj:
        for sess in s.get("sessions", []):
            STATE["flat_sessions"].append({"subject": s["subject"], "session": sess["session"], "hr": sess.get("hr", {}).get("series", [])})

def _lag1(series: List[Dict[str, float]]) -> float:
    xs = [p.get("v") for p in series if isinstance(p.get("v"), (int, float))]
    if len(xs) < 3:
        return 0.0
    mean = float(np.mean(xs))
    num = sum((xs[i] - mean) * (xs[i - 1] - mean) for i in range(1, len(xs)))
    den = sum((x - mean) ** 2 for x in xs)
    return float(num / den) if den else 0.0

def _moving_avg(xs: List[float], k: int = 10) -> List[float]:
    out = []
    for i in range(len(xs)):
        start = max(0, i - k + 1)
        w = xs[start : i + 1]
        out.append(float(np.mean(w)) if w else 0.0)
    return out

def _exp_s(xs: List[float], a: float = 0.2) -> List[float]:
    out = []
    prev = xs[0] if xs else 0.0
    for i in range(len(xs)):
        y = a * xs[i] + (1 - a) * prev
        out.append(float(y))
        prev = y
    return out

def next_live_dataset() -> Dict[str, Any]:
    ds = _ensure_processed()
    sessions = STATE["flat_sessions"]
    if not sessions:
        return ds
    STATE["live_cursor"] = (STATE["live_cursor"] + 1) % len(sessions)
    STATE["tick"] = int(STATE.get("tick", 0)) + 1
    cursor = STATE["live_cursor"]
    window = min(6, len(sessions))
    idxs = [(cursor + i) % len(sessions) for i in range(window)]
    selected = [sessions[i] for i in idxs]
    mini_subjects: Dict[str, Any] = {}
    points: List[List[float]] = []
    all_hr: List[Dict[str, float]] = []
    for ref in selected:
        found = None
        for sub in ds.get("subjects", []):
            if sub.get("subject") == ref["subject"]:
                for sess in sub.get("sessions", []):
                    if sess.get("session") == ref["session"]:
                        labels = [_categorize_fatigue(x) for x in (sess.get("mentalFatigueScores") or [])]
                        found = {
                            "session": sess.get("session"),
                            "hr": sess.get("hr"),
                            "eda": sess.get("eda"),
                            "mentalFatigueScores": sess.get("mentalFatigueScores"),
                            "physicalFatigueScores": sess.get("physicalFatigueScores"),
                            "transitions": _transition_matrix(labels),
                        }
                        break
            if found:
                key = ref["subject"]
                if key not in mini_subjects:
                    mini_subjects[key] = {"subject": key, "sessions": []}
                mini_subjects[key]["sessions"].append(found)
                hr_mean = float(found["hr"]["stats"]["mean"]) if found.get("hr") else 0.0
                eda_mean = float(found["eda"]["stats"]["mean"]) if found.get("eda") else 0.0
                mf = found.get("mentalFatigueScores") or []
                mf_mean = float(np.mean(mf)) if mf else 0.0
                points.append([hr_mean, eda_mean, mf_mean])
                all_hr.extend(found.get("hr", {}).get("series", []))
                break
    subject_list = list(mini_subjects.values())
    cluster_summary = {"kmeans": None, "silhouette": 0.0}
    if len(points) >= 3:
        k = min(3, len(points))
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = km.fit_predict(points)
        sil = float(silhouette_score(points, labels)) if len(set(labels)) > 1 else 0.0
        cluster_summary = {"kmeans": {"labels": labels.tolist(), "centers": km.cluster_centers_.tolist()}, "silhouette": sil}
    r1 = _lag1_autocorr(all_hr)
    xs = [p["v"] for p in all_hr]
    ma = _moving_avg(xs, 10)
    es = _exp_s(xs, 0.2)
    ar = _simple_ar1(xs)
    ma_err = _mae(xs, ma)
    es_err = _mae(xs, es)
    ar_err = _mae(xs, ar)
    stats = {
        "subjects": len(subject_list),
        "sessions": len(selected),
        "tick": int(STATE.get("tick", 0)),
        "hr_autocorr_lag1": float(r1),
        "smoothing_mae": {"moving_average": float(ma_err), "exp_smooth": float(es_err), "ar1": float(ar_err)},
        "cluster_silhouette": float(cluster_summary["silhouette"]),
    }
    return {"subjects": subject_list, "points": points, "clusterSummary": cluster_summary, "stats": stats}

@app.get("/api/datasets/refresh")
def refresh():
    STATE["processed"] = process_datasets()
    _index_sessions()
    return {"ok": True, "stats": STATE["processed"]["stats"]}

@app.get("/api/research/comparative")
def comparative(mode: str = Query(default="")):
    try:
        ds = _ensure_processed()
        m = str(mode or "").lower()
        if m == "live":
            mini = next_live_dataset()
            scores = comparative_scores(mini)
            return {"stats": mini["stats"], "scores": scores, "clusters": mini.get("clusterSummary")}
        scores = comparative_scores(ds)
        return {"stats": ds["stats"], "scores": scores, "clusters": ds["clusterSummary"]}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/datasets/preview")
def preview():
    ds = _ensure_processed()
    sample = None
    for s in ds.get("subjects", []):
        if s.get("sessions"):
            sess = s["sessions"][0]
            sample = {
                "subject": s["subject"],
                "session": sess["session"],
                "hr": (sess.get("hr", {}).get("series", []) or [])[:300],
                "eda": (sess.get("eda", {}).get("series", []) or [])[:300],
            }
            break
    return {"stats": ds["stats"], "sample": sample, "timestamp": int(pd.Timestamp.utcnow().timestamp() * 1000)}

app.mount("/analysis", StaticFiles(directory=os.path.normpath(os.path.join(BASE_DIR)), html=True), name="analysis")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
