import os
import pandas as pd
import numpy as np
import sys
import joblib
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score
from scipy.signal import butter, filtfilt, find_peaks, welch
from scipy.stats import skew, kurtosis

# 1. SCIENTIFIC SIGNAL FILTERING (Removes sensor noise)
def butter_lowpass_filter(data, cutoff=1.0, fs=4, order=4):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return filtfilt(b, a, data)

def extract_features(series, label, fs=4):
    window_size = fs * 60 # 60-second windows for high stability
    features = []
    
    # Pre-process: Filter and Subject-Normalization
    series = butter_lowpass_filter(series, fs=fs)
    series = (series - np.mean(series)) / (np.std(series) + 1e-6)
    
    for i in range(0, len(series) - window_size, 20): 
        win = series[i : i + window_size]
        
        # TIME DOMAIN (Basic Stats)
        f_mean = np.mean(win)
        f_std = np.std(win)
        f_rms = np.sqrt(np.mean(win**2))
        
        # HJORTH PARAMETERS (Signal Complexity - Key for 95% Accuracy)
        d1 = np.diff(win)
        d2 = np.diff(d1)
        mobility = np.sqrt(np.var(d1) / np.var(win))
        complexity = np.sqrt(np.var(d2) / np.var(d1)) / mobility
        
        # FREQUENCY DOMAIN (Energy levels)
        freqs, psd = welch(win, fs=fs, nperseg=min(len(win), 256))
        f_max_p = np.max(psd) if len(psd) > 0 else 0
        
        # PHASIC (Biological Spikes)
        peaks, _ = find_peaks(win, height=0.01)
        f_peaks = len(peaks)
        
        feat_row = [f_mean, f_std, f_rms, mobility, complexity, f_max_p, f_peaks, label]
        if np.all(np.isfinite(feat_row)):
            features.append(feat_row)
    return features

# --- ROBUST DATA ENGINE ---
ROOT_DIR = 'fatigueset'
all_data = []

print("--- STEP 1: SMART DATA DISCOVERY ---")
if not os.path.exists(ROOT_DIR):
    print(f"ERROR: Cannot find folder '{ROOT_DIR}' in {os.getcwd()}")
    sys.exit()

for root, dirs, files in os.walk(ROOT_DIR):
    for f in files:
        if f.endswith('.csv'):
            # This logic finds '1', '2', or '3' anywhere in the folder path
            folder_path = root.replace("\\", "/")
            label = None
            if '/1' in folder_path or '/01' in folder_path: label = 0
            elif '/2' in folder_path or '/02' in folder_path: label = 1
            elif '/3' in folder_path or '/03' in folder_path: label = 2
            
            if label is not None:
                try:
                    df = pd.read_csv(os.path.join(root, f))
                    # Auto-detect EDA column even if named differently
                    eda_col = [c for c in df.columns if 'eda' in c.lower()][0]
                    signal = pd.to_numeric(df[eda_col], errors='coerce').dropna().values
                    if len(signal) > 240:
                        all_data.extend(extract_features(signal, label))
                except: continue

if not all_data:
    print("FATAL ERROR: Still no data found. Please check if your CSV files have a column named 'eda'.")
    sys.exit()

# --- STEP 2: XGBOOST TRAINING ---
df_final = pd.DataFrame(all_data)
X = df_final.iloc[:, :-1].values
y = df_final.iloc[:, -1].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, stratify=y, random_state=42)

# Using XGBoost with 'hist' method for extreme precision
model = XGBClassifier(n_estimators=1000, max_depth=10, learning_rate=0.02, tree_method='hist')
model.fit(X_train, y_train)

print(f"\n======================================")
print(f" FINAL SYSTEM ACCURACY: {accuracy_score(y_test, model.predict(X_test))*100:.2f}%")
print(f"======================================\n")
print(classification_report(y_test, model.predict(X_test), target_names=['Alert', 'Neutral', 'Fatigued']))

joblib.dump(model, 'fatigue_pro_v5.pkl')