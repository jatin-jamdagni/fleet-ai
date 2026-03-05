import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./lib/queryClient";
import { useAuthStore } from "./store/auth.store";
import { Sidebar } from "./components/layout/Sidebar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Invoices from "./pages/Invoices";
import Team from "./pages/Team";
import AILogs from "./pages/AILogs";
import Analytics from "./pages/Analytics";
import BillingPage from "./pages/billing/BillingPage";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import TripReplay from "./pages/trips/TripReplay";
import SchedulePage from "./pages/trips/SchedulePage";
import SafetyPage from "./pages/safety/SafetyPage";
import SettingsPage from "./pages/settings/SettingsPage";
import SharePage from "./pages/portal/SharePage";
import IntegrationsPage from "./pages/integrations/IntegrationsPage";


// ─── Protected layout ─────────────────────────────────────────────────────────

function AppLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Guest guard ──────────────────────────────────────────────────────────────

function GuestOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <GuestOnly><Login /></GuestOnly>
          } />
          <Route path="/register" element={
            <GuestOnly><Register /></GuestOnly>
          } />
          <Route path="/accept-invite" element={<GuestOnly><AcceptInvite /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
          <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
          <Route path="/share/:token" element={<SharePage />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/team" element={<Team />} />
            <Route path="/ai" element={<AILogs />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/billing" element={<BillingPage />} />

            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/settings" element={<SettingsPage />} />


            <Route path="/trips/:id/replay" element={<TripReplay />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />

          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "monospace",
            fontSize: "13px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
