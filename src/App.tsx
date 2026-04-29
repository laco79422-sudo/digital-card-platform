import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuthSync";
import { AdminWithdrawalRequestsPage } from "@/pages/AdminWithdrawalRequestsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminDesignRequestsPage } from "@/pages/AdminDesignRequestsPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { InstantCardClaimEffect } from "@/components/instant/InstantCardClaimEffect";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { CardEditorPage } from "@/pages/CardEditorPage";
import { CreateCardForOthersPage } from "@/pages/CreateCardForOthersPage";
import { CreatorDirectoryPage } from "@/pages/CreatorDirectoryPage";
import { CreatorProfilePage } from "@/pages/CreatorProfilePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DesignerRequestsPage } from "@/pages/DesignerRequestsPage";
import { DesignRequestPage } from "@/pages/DesignRequestPage";
import { EducationPage } from "@/pages/EducationPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyCardsPage } from "@/pages/MyCardsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PartnerDashboardPage } from "@/pages/PartnerDashboardPage";
import { PricingPage } from "@/pages/PricingPage";
import { PromotionGuidePage } from "@/pages/PromotionGuidePage";
import { PromotionPartnerPage } from "@/pages/PromotionPartnerPage";
import { PromotePage } from "@/pages/PromotePage";
import { NfcAcceptPage } from "@/pages/NfcAcceptPage";
import { PublicCardPage } from "@/pages/PublicCardPage";
import { ReservationPaymentPage } from "@/pages/ReservationPaymentPage";
import { TempCardPreviewPage } from "@/pages/TempCardPreviewPage";
import { RequestCreatePage } from "@/pages/RequestCreatePage";
import { RequestListPage } from "@/pages/RequestListPage";
import { SignupPage } from "@/pages/SignupPage";
import { StructureBlueprintPage } from "@/pages/StructureBlueprintPage";
import { AdsCreatePage } from "@/pages/AdsCreatePage";
import { AdvertiserDashboardPage } from "@/pages/AdvertiserDashboardPage";
import { ReferralCaptureEffect } from "@/components/referral/ReferralCaptureEffect";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useParams } from "react-router-dom";

function EditAliasRedirect() {
  const { id = "" } = useParams();
  return <Navigate to={`/cards/${encodeURIComponent(id)}/edit`} replace />;
}

function AppRoutes() {
  useSupabaseAuthSync();
  useInactivityLogout();

  return (
    <>
      <InstantCardClaimEffect />
      <Routes>
        <Route path="/c/:slug" element={<PublicCardPage />} />
        <Route path="/pay/reservation/:reservationId" element={<ReservationPaymentPage />} />
        <Route path="/nfc/:cardId" element={<NfcAcceptPage />} />
        <Route path="/preview/:tempId" element={<TempCardPreviewPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="structure" element={<StructureBlueprintPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="promotion/guide" element={<PromotionGuidePage />} />
          <Route path="promotion/partner" element={<PromotionPartnerPage />} />
          <Route path="promote" element={<PromotePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="mypage" element={<Navigate to="/dashboard" replace />} />
          <Route path="space" element={<Navigate to="/dashboard" replace />} />
          <Route path="my-space" element={<Navigate to="/dashboard" replace />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="create-for-others" element={<CreateCardForOthersPage />} />
          <Route path="create-card" element={<CardEditorPage />} />
          <Route path="request" element={<DesignRequestPage />} />
        <Route path="creators" element={<CreatorDirectoryPage />} />
        <Route path="creators/:id" element={<CreatorProfilePage />} />
        <Route path="requests" element={<RequestListPage />} />

        <Route
          path="partner/dashboard"
          element={
            <ProtectedRoute requirePartner>
              <PartnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ads/create"
          element={
            <ProtectedRoute>
              <AdsCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ads/dashboard"
          element={
            <ProtectedRoute>
              <AdvertiserDashboardPage />
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
          path="edit/:id"
          element={
            <ProtectedRoute roles={["client", "company_admin", "admin"]}>
              <EditAliasRedirect />
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
          path="designer/requests"
          element={
            <ProtectedRoute>
              <DesignerRequestsPage />
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
        <Route
          path="admin/design-requests"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDesignRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/withdrawals"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminWithdrawalRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ReferralCaptureEffect />
      <AppRoutes />
    </BrowserRouter>
  );
}
