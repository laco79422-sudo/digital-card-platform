import { AuthOAuthErrorBridge } from "@/components/layout/AuthOAuthErrorBridge";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { logDevDomBaseline, useDevMountLog } from "@/dev/renderDiagnostics";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  useDevMountLog("AppLayout");
  useEffect(() => {
    logDevDomBaseline();
  }, []);

  const { pathname } = useLocation();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex min-h-dvh flex-col">
      <AuthOAuthErrorBridge />
      {isDashboard ? <DashboardNavbar /> : <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isDashboard ? null : <Footer />}
    </div>
  );
}
