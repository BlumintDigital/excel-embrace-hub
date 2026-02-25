import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncOnReconnect } from "@/components/SyncOnReconnect";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import BulkImport from "@/pages/BulkImport";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import Budget from "@/pages/Budget";
import Timeline from "@/pages/Timeline";
import Team from "@/pages/Team";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import Documents from "@/pages/Documents";
import UserGuide from "@/pages/UserGuide";
import ActivityLog from "@/pages/ActivityLog";
import SettingsPage from "@/pages/SettingsPage";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PdfConverter from "@/pages/PdfConverter";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min — skip re-fetch on every navigation
      gcTime:    1000 * 60 * 60 * 24,  // 24 hrs — keep data alive for offline use
      retry: (count) => navigator.onLine && count < 2,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "blumint-query-cache",
  throttleTime: 1000,
});

const App = () => (
  <ThemeProvider>
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OfflineBanner />
        <SyncOnReconnect />
        <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/team" element={<Team />} />
                <Route path="/team/:id" element={<TeamMemberDetail />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/guide" element={<UserGuide />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/pdf-converter" element={<PdfConverter />} />
                <Route path="/import" element={<BulkImport />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
  </ThemeProvider>
);

export default App;
