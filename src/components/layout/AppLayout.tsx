import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex min-h-dvh flex-col">
      {isDashboard ? <DashboardNavbar /> : <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isDashboard ? null : <Footer />}
    </div>
  );
}
