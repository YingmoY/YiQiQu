import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// 页面组件导入
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CreateActivity from "./pages/CreateActivity";
import ActivityDetail from "./pages/ActivityDetail";
import Chat from "./pages/Chat";
import Evaluate from "./pages/Evaluate";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function Router() {
  const [location, setLocation] = useLocation();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  // 校验登录状态与授权拦截
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthed(false);
      if (location !== '/auth') {
        setLocation('/auth');
      }
    } else {
      setIsAuthed(true);
    }
  }, [location]);

  // 监听无感刷新 Token 失败或 401 事件
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthed(false);
      setLocation('/auth');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  if (isAuthed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-10 h-10 border-4 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateActivity} />
      <Route path="/activities/:id" component={ActivityDetail} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/activities/:id/evaluate" component={Evaluate} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />
      {/* 兜底 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" closeButton richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
