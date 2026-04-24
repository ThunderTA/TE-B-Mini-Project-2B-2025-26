import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ViewProvider, useView } from "@/contexts/ViewContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ReportDataProvider } from "@/contexts/ReportContext";
import Index from "./pages/Index";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import CognitiveLoad from "./pages/CognitiveLoad";
import TeamClusters from "./pages/TeamClusters";
import PrivacyGuard from "./pages/PrivacyGuard";
import SettingsPage from "./pages/SettingsPage";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import { AuthLayout } from "./components/AuthLayout";
import FatigueReconPage from "./pages/FatigueReconPage";
import { Button } from "@/components/ui/button";
import LoadPlanner from "./pages/LoadPlanner";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const { ambience, setAmbience, theme, setTheme } = useView();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ambiencePromptOpen, setAmbiencePromptOpen] = useState<boolean>(true);
  const hasShownRef = useRef<boolean>(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/verify-email';
  useEffect(() => {
    if (!isAuthPage && !hasShownRef.current) {
      setAmbiencePromptOpen(true);
    }
  }, []); 
  const prevPathRef = useRef<string>(location.pathname);
  useEffect(() => {
    const wasAuth = prevPathRef.current === '/login' || prevPathRef.current === '/signup' || prevPathRef.current === '/verify-email';
    if (!isAuthPage && wasAuth && !hasShownRef.current) {
      setAmbiencePromptOpen(true);
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, isAuthPage]);
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [theme]);

  useEffect(() => {
    if (ambience === "relaxing") {
      document.body.classList.add("bg-transparent");
      document.body.classList.remove("bg-background");
    } else {
      document.body.classList.remove("bg-transparent");
      document.body.classList.add("bg-background");
    }
  }, [ambience]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (ambience === "simple") {
      v.pause();
      v.muted = true;
      return;
    }
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [ambience]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isAuthPage) {
      v.pause();
      v.muted = true;
    }
  }, [isAuthPage]);

  return (
    <>
      {ambience === "relaxing" ? (
        <video
          ref={videoRef}
          id="global-bg-video"
          autoPlay
          loop
          playsInline
          className="fixed inset-0 z-[-10] w-full h-full object-cover"
        >
          <source src="/japan_bg.mp4" type="video/mp4" />
          <source src="http://localhost:8000/japan_bg.mp4" type="video/mp4" />
          <source src="http://localhost:8001/japan_bg.mp4" type="video/mp4" />
        </video>
      ) : (
        <div
          id="simple-bg"
          className={`fixed inset-0 z-[-10] w-full h-full ${theme === "light" ? "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50" : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"}`}
        />
      )}
      <div className={`fixed inset-0 z-0 pointer-events-none ${ambience === "relaxing" ? "bg-black/20" : "bg-background/30"}`} />
      {ambiencePromptOpen && !['/login','/signup','/verify-email'].includes(location.pathname) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="glass-card p-4 border border-border w-full max-w-sm">
            <div className="text-sm font-semibold mb-3">Choose site ambience & theme</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAmbience("simple");
                  setAmbiencePromptOpen(false);
                  try { localStorage.setItem("ambience", "simple"); } catch {}
                  hasShownRef.current = true;
                }}
              >
                Simple
              </Button>
              <Button
                onClick={() => {
                  setAmbience("relaxing");
                  setAmbiencePromptOpen(false);
                  try { localStorage.setItem("ambience", "relaxing"); } catch {}
                  hasShownRef.current = true;
                }}
              >
                Relaxing
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => {
                  setTheme("dark");
                  try { localStorage.setItem("theme", "dark"); } catch {}
                }}
              >
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => {
                  setTheme("light");
                  try { localStorage.setItem("theme", "light"); } catch {}
                }}
              >
                Light
              </Button>
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
        <Route path="/verify-email" element={<AuthLayout><EmailVerificationPage /></AuthLayout>} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/dashboard" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Index />
            </RequireAuth>
          }
        />
        <Route
          path="/cognitive-load"
          element={
            <RequireAuth>
              <CognitiveLoad />
            </RequireAuth>
          }
        />
        <Route
          path="/team-clusters"
          element={
            <RequireAuth>
              <TeamClusters />
            </RequireAuth>
          }
        />
        <Route
          path="/privacy-guard"
          element={
            <RequireAuth>
              <PrivacyGuard />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/fatigue-recon"
          element={
            <RequireAuth>
              <FatigueReconPage />
            </RequireAuth>
          }
        />
        <Route
          path="/load-planner"
          element={
            <RequireAuth>
              <LoadPlanner />
            </RequireAuth>
          }
        />
        <Route
          path="/team-select"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <NotificationProvider>
              <ViewProvider>
                <ReportDataProvider>
                  <AppContent />
                </ReportDataProvider>
              </ViewProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
