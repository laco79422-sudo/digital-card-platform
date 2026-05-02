import { hasActiveReferralSignupContext } from "@/lib/activeReferralSession";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

/** Navbar·랜딩·회원가입 버튼 문구 분기 등 */
export function useReferralSignupCta(): { isReferralUser: boolean; signupPrimaryLabel: "시작하기" | "회원가입" } {
  const { pathname, search } = useLocation();

  const isReferralUser = useMemo(
    () => hasActiveReferralSignupContext(pathname, search),
    [pathname, search],
  );

  return {
    isReferralUser,
    signupPrimaryLabel: isReferralUser ? "시작하기" : "회원가입",
  };
}
