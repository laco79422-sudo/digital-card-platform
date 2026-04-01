import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuthSync";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { CardEditorPage } from "@/pages/CardEditorPage";
import { CreatorDirectoryPage } from "@/pages/CreatorDirectoryPage";
import { CreatorProfilePage } from "@/pages/CreatorProfilePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EducationPage } from "@/pages/EducationPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyCardsPage } from "@/pages/MyCardsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PricingPage } from "@/pages/PricingPage";
import { PublicCardPage } from "@/pages/PublicCardPage";
import { RequestCreatePage } from "@/pages/RequestCreatePage";
import { RequestListPage } from "@/pages/RequestListPage";
import { SignupPage } from "@/pages/SignupPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function AppRoutes() {
  useSupabaseAuthSync();
  useInactivityLogout();

  return (
    <Routes>
      <Route path="/c/:slug" element={<PublicCardPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="mypage" element={<Navigate to="/dashboard" replace />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="creators" element={<CreatorDirectoryPage />} />
        <Route path="creators/:id" element={<CreatorProfilePage />} />
        <Route path="requests" element={<RequestListPage />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cards"
          element={
            <ProtectedRoute roles={["client", "company_admin", "admin"]}>
              <MyCardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cards/new"
          element={
            <ProtectedRoute roles={["client", "company_admin", "admin"]}>
              <CardEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cards/:id/edit"
          element={
            <ProtectedRoute roles={["client", "company_admin", "admin"]}>
              <CardEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="requests/new"
          element={
            <ProtectedRoute roles={["client", "company_admin", "admin"]}>
              <RequestCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications"
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
