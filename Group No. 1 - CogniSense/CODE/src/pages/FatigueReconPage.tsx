import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaceMesh, FACEMESH_TESSELATION, FACEMESH_LIPS } from "@mediapipe/face_mesh";
import { drawConnectors } from "@mediapipe/drawing_utils";

type Landmark = { x: number; y: number; z?: number };
type FaceMeshResults = {
  image: CanvasImageSource;
  multiFaceLandmarks?: Landmark[][];
};

export default function FatigueReconPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<"camera" | "meet">("camera");
  const [nodeCount, setNodeCount] = useState(0);
  const [eyeCoord, setEyeCoord] = useState({ x: 0, y: 0 });
  const [noseCoord, setNoseCoord] = useState({ x: 0, y: 0 });
  const [mouthCoord, setMouthCoord] = useState({ x: 0, y: 0 });
  const [faceCoord, setFaceCoord] = useState({ x: 0, y: 0 });
  const [subjects, setSubjects] = useState<
    { mood: string; color: string; fatigue: number }[]
  >([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTimer, setAlertTimer] = useState(0);
  const highFatigueStartTimeRef = useRef<number | null>(null);
  const showAlertRef = useRef(false);
  const lastAlertTimeRef = useRef<number>(0);

  // Sync showAlert state to ref
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    let interval: number | null = null;
    if (showAlert && alertTimer > 0) {
      interval = window.setInterval(() => {
        setAlertTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (alertTimer === 0) {
      setShowAlert(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showAlert, alertTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    // Force reset body styles that might have been added by previous versions of this page
    document.body.style.overflow = "auto";
    document.body.style.background = "";
    document.body.style.color = "";
    document.body.style.fontFamily = "";
    
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function switchSource(nextMode: "camera" | "meet") {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const stream =
      nextMode === "meet"
        ? await navigator.mediaDevices.getDisplayMedia({ video: true })
        : await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
          });
    video.srcObject = stream as MediaStream;
    setMode(nextMode);
    // Removed CSS transform to handle mirroring inside canvas drawing for readable text
    // canvas.style.transform = nextMode === "meet" ? "scaleX(1)" : "scaleX(-1)";
  }

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fm = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    fm.setOptions({
      maxNumFaces: 4,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
    });
    fm.onResults((results: FaceMeshResults) => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mirror image and landmarks if in camera mode
      if (mode === "camera") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      const faces = results.multiFaceLandmarks;
      if (faces && faces.length > 0) {
        setNodeCount(faces.length);
        const lm = faces[0];
        setEyeCoord({ x: Number(lm[33].x.toFixed(2)), y: Number(lm[33].y.toFixed(2)) });
        setNoseCoord({ x: Number(lm[1].x.toFixed(2)), y: Number(lm[1].y.toFixed(2)) });
        setMouthCoord({ x: Number(lm[13].x.toFixed(2)), y: Number(lm[13].y.toFixed(2)) });
        setFaceCoord({ x: Number(lm[10].x.toFixed(2)), y: Number(lm[10].y.toFixed(2)) });

        const list: { mood: string; color: string; fatigue: number }[] = [];
        let maxFatigue = 0;
        
        faces.forEach((faceLm: Landmark[], index: number) => {
          drawConnectors(ctx, faceLm, FACEMESH_TESSELATION, { color: "#38bdf820", lineWidth: 0.5 });
          drawConnectors(ctx, faceLm, FACEMESH_LIPS, { color: "#10b981", lineWidth: 2 });
          const ear = Math.hypot(faceLm[159].x - faceLm[145].x, faceLm[159].y - faceLm[145].y);
          const mar = Math.hypot(faceLm[13].x - faceLm[14].x, faceLm[13].y - faceLm[14].y);
          
          // Smoother fatigue calculation: 0% at 0.03 EAR, 100% at 0.01 EAR
          // This places the 70% threshold naturally around 0.016 EAR (heavy drowsy/closed)
          const rawFatigue = 100 - ((ear - 0.01) / (0.03 - 0.01) * 100);
          const fatigue = Math.floor(Math.min(100, Math.max(0, rawFatigue)));
          if (fatigue > maxFatigue) maxFatigue = fatigue;

          let mood = "NORMAL";
          let color = "#38bdf8";
          if (mar > 0.05) {
            mood = "FATIGUE";
            color = "#ef4444";
          } else if (ear < 0.018) {
            mood = "DROWSY";
            color = "#f59e0b";
          }
          list.push({ mood, color, fatigue });

          // Bounding Box Calculation
          let minX = 1, minY = 1, maxX = 0, maxY = 0;
          faceLm.forEach((pt: Landmark) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
          });

          const pad = 0.02; // Small padding
          const boxX = (minX - pad) * canvas.width;
          const boxY = (minY - pad) * canvas.height;
          const boxW = (maxX - minX + 2 * pad) * canvas.width;
          const boxH = (maxY - minY + 2 * pad) * canvas.height;

          // Draw Bounding Box
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.lineJoin = "round";
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Draw ID Label Box (top-right of face box)
          ctx.fillStyle = color;
          const labelSize = 36;
          ctx.fillRect(boxX + boxW - labelSize, boxY - labelSize, labelSize, labelSize);

          // Draw ID Number
          ctx.fillStyle = "white";
          ctx.font = "900 24px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (mode === "camera") {
            ctx.save();
            // Flip text back so it's readable
            ctx.translate(boxX + boxW - labelSize / 2, boxY - labelSize / 2);
            ctx.scale(-1, 1);
            ctx.fillText(`${index + 1}`, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(`${index + 1}`, boxX + boxW - labelSize / 2, boxY - labelSize / 2);
          }
        });
        setSubjects(list);

        // Debug: Log fatigue to console for verification
        if (maxFatigue > 40) {
          const timeOver = highFatigueStartTimeRef.current ? ((Date.now() - highFatigueStartTimeRef.current) / 1000).toFixed(1) : 0;
          console.log(`[Fatigue Sentinel] Current: ${maxFatigue}%, Time over 70%: ${timeOver}s, Alert Visible: ${showAlertRef.current}`);
        }

        // Alert Logic: Trigger every 10 seconds of fatigue > 70%
        if (maxFatigue >= 70) {
          if (highFatigueStartTimeRef.current === null) {
            highFatigueStartTimeRef.current = Date.now();
          } else if (!showAlertRef.current) {
            const timeDiff = Date.now() - highFatigueStartTimeRef.current;
            const cooldownPassed = Date.now() - lastAlertTimeRef.current > 5000; // 5s cooldown after closing

            if (timeDiff > 10000 && cooldownPassed) {
              console.log(`[Fatigue Sentinel] ALERT TRIGGERED! Max Fatigue: ${maxFatigue}%`);
              setShowAlert(true);
              lastAlertTimeRef.current = Date.now();
              
              // 70-79% -> 5 min (300s), 80-89% -> 10 min (600s), 90%+ -> 15 min (900s)
              let timerSeconds = 300;
              if (maxFatigue >= 90) timerSeconds = 900;
              else if (maxFatigue >= 80) timerSeconds = 600;
              setAlertTimer(timerSeconds);
            }
          }
        } else {
          highFatigueStartTimeRef.current = null;
        }
      }
      ctx.restore();
    });
    faceMeshRef.current = fm;

    let mounted = true;
    const loop = async () => {
      if (!mounted) return;
      if (video.readyState >= 2 && faceMeshRef.current) {
        await faceMeshRef.current.send({ image: video });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    switchSource("camera").then(() => loop());
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <DashboardLayout showMetrics={false}>
      <style>{`
        .recon-glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .recon-neon { box-shadow: 0 0 20px rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); }
        canvas { border-radius: 1.5rem; width: 100%; height: auto; transition: all 0.3s ease; }
        .active-source { background: #0ea5e9; color: white; box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); }
        .text-huge { font-size: 3.5rem; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #94a3b8; font-weight: 800; }
      `}</style>
      <div className="space-y-4 max-w-[1600px] mx-auto relative">
        {/* Emergency Alert Overlay */}
        {showAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-2xl w-full mx-4 p-12 rounded-[3rem] border-2 border-red-500/50 bg-black/40 shadow-[0_0_100px_rgba(239,68,68,0.3)] text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
              
              <div className="space-y-2">
                <h2 className="text-red-500 font-black text-2xl tracking-[0.3em] uppercase">Emergency Alert</h2>
                <div className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Critical Fatigue Detected</div>
              </div>

              <div className="space-y-4">
                <div className="text-[12rem] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-2xl">
                  {formatTime(alertTimer)}
                </div>
                <p className="text-red-400 font-bold text-lg uppercase tracking-widest">Mandatory Recovery Period</p>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => {
                    setShowAlert(false);
                    // Reset the high fatigue start time so it can trigger again after another 10s
                    highFatigueStartTimeRef.current = null;
                  }}
                  className="px-12 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                >
                  Dismiss Alert
                </button>
              </div>
              
              <p className="text-white/20 text-[9px] font-mono">ID: FATIGUE_INTERVENTION_SIG_HI_07</p>
            </div>
          </div>
        )}

        <div className="recon-glass p-4 rounded-2xl flex flex-wrap gap-4 justify-between items-center recon-neon">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-sky-500 tracking-tighter">
              SENTINEL <span className="text-foreground">PRO</span>
            </h1>
            <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
              <span>
                TRACKING: <span className="text-sky-400">{nodeCount}</span>
              </span>
              <span>
                ENGINE:{" "}
                <span className="text-emerald-400">{mode === "camera" ? "WEBCAM" : "MEET"}</span>
              </span>
            </div>
          </div>
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => switchSource("camera")}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${
                mode === "camera" ? "active-source" : "text-slate-400"
              }`}
            >
              MY CAMERA
            </button>
            <button
              onClick={() => switchSource("meet")}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${
                mode === "meet" ? "active-source" : "text-slate-400"
              }`}
            >
              GOOGLE MEET
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
          <div className="lg:col-span-3 space-y-4">
            <div className="recon-glass p-6 rounded-[2rem] h-full flex flex-col gap-6">
              <p className="text-sky-500 font-black text-[10px] tracking-[0.2em] uppercase border-b border-white/5 pb-3">
                Anatomical HUD
              </p>
              <div className="grid grid-cols-1 gap-4 flex-1">
                <div className="space-y-1">
                  <span className="stat-label uppercase">Eye_L_R Center</span>
                  <div className="text-sky-400 font-bold text-base">
                    X:{eyeCoord.x.toFixed(2)} Y:{eyeCoord.y.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="stat-label uppercase">Nose_Tip Apex</span>
                  <div className="text-emerald-400 font-bold text-base">
                    X:{noseCoord.x.toFixed(2)} Y:{noseCoord.y.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="stat-label uppercase">Mouth_Outline</span>
                  <div className="text-orange-400 font-bold text-base">
                    X:{mouthCoord.x.toFixed(2)} Y:{mouthCoord.y.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="stat-label uppercase">Face_Oval Bounds</span>
                  <div className="text-foreground font-bold text-base">
                    X:{faceCoord.x.toFixed(2)} Y:{faceCoord.y.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5 font-mono text-[9px] text-blue-300/50 leading-tight">
                &gt; GPU_ACCEL: READY
                <br />
                &gt; MESH_NODES: 468
                <br />
                &gt; SCAN_MODE: FULL_MESH
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative bg-black rounded-[2rem] overflow-hidden border border-white/5 flex items-center justify-center">
            <video ref={videoRef} className="hidden" autoPlay playsInline />
            <canvas ref={canvasRef} className="max-h-full object-contain" />
          </div>

          <div className="lg:col-span-3 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
            {subjects.length === 0 ? (
              <div className="recon-glass p-8 rounded-[2rem] flex items-center justify-center text-slate-600 border-dashed border-2 border-slate-800/50 h-48">
                <p className="font-bold text-[10px] tracking-widest uppercase opacity-50">Awaiting Subjects...</p>
              </div>
            ) : (
              subjects.map((s, i) => (
                <div
                  key={i}
                  className="recon-glass p-6 rounded-[2rem] transition-all border-l-4"
                  style={{ borderLeftColor: s.color }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white font-black text-[12px] shadow-lg" 
                        style={{ backgroundColor: s.color }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">Subject ID</span>
                    </div>
                    <span
                      className="text-[10px] font-black px-3 py-0.5 rounded-full bg-black/20"
                      style={{ color: s.color }}
                    >
                      {s.mood}
                    </span>
                  </div>
                  <div className="text-huge font-black text-foreground">{s.fatigue}%</div>
                  <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Core Fatigue Index</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
