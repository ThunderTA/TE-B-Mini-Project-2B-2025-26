import json
import os
from glob import glob

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error


def load_fatigue_data(root: str) -> pd.DataFrame:
    rows = []
    pattern = os.path.join(root, "datasets", "fatigueset", "*", "*", "exp_fatigue.csv")
    for fp in glob(pattern):
        try:
            df = pd.read_csv(fp)
            for _, r in df.iterrows():
                rows.append(
                    {
                        "measurementNumber": int(r["measurementNumber"]),
                        "physicalFatigueScore": float(r["physicalFatigueScore"]),
                        "mentalFatigueScore": float(r["mentalFatigueScore"]),
                        "source": fp,
                    }
                )
        except Exception:
            pass
    return pd.DataFrame(rows)


def train_model(df: pd.DataFrame):
    df = df.dropna(subset=["physicalFatigueScore", "mentalFatigueScore"])
    X = df[["physicalFatigueScore"]].values
    y = df["mentalFatigueScore"].values
    model = LinearRegression()
    model.fit(X, y)
    y_pred = model.predict(X)
    metrics = {
        "r2": float(r2_score(y, y_pred)),
        "mae": float(mean_absolute_error(y, y_pred)),
    }
    return model, metrics


def save_model(root: str, model: LinearRegression, metrics: dict):
    out_dir = os.path.join(root, "public", "model")
    os.makedirs(out_dir, exist_ok=True)
    payload = {
        "type": "linear_regression",
        "features": ["physicalFatigueScore"],
        "coef": model.coef_.tolist(),
        "intercept": float(model.intercept_),
        "metrics": metrics,
    }
    with open(os.path.join(out_dir, "fatigue_model.json"), "w") as f:
        json.dump(payload, f, indent=2)


def save_predictions(root: str, df: pd.DataFrame, model: LinearRegression):
    out_dir = os.path.join(root, "public", "predictions")
    os.makedirs(out_dir, exist_ok=True)
    preds = []
    for _, r in df.iterrows():
        x = [[float(r["physicalFatigueScore"])]]
        y_hat = float(model.predict(x)[0])
        # scale to [0,100]
        risk = max(0.0, min(100.0, y_hat))
        preds.append(
            {
                "measurementNumber": int(r["measurementNumber"]),
                "physicalFatigueScore": float(r["physicalFatigueScore"]),
                "mentalFatigueScore": float(r["mentalFatigueScore"]),
                "mentalFatiguePred": risk,
            }
        )
    with open(os.path.join(out_dir, "fatigue_predictions.json"), "w") as f:
        json.dump({"items": preds}, f, indent=2)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    df = load_fatigue_data(root)
    if df.empty:
        print("No fatigue data found under datasets/fatigueset/*/*/exp_fatigue.csv")
        return
    model, metrics = train_model(df)
    save_model(root, model, metrics)
    save_predictions(root, df, model)
    print("Model and predictions saved under public/model and public/predictions")
    print(f"Metrics: {metrics}")


if __name__ == "__main__":
    main()
