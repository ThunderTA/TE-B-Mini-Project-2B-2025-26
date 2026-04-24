import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ml_visualization import app

if __name__ == "__main__":
    print("Starting ML Visualization API...")
    app.run()
