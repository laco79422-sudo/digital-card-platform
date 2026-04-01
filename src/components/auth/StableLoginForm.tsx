import { Button } from "@/components/ui/Button";
import { form } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const loginInputClass = cn(
  form.input,
  "focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 focus:ring-offset-0",
);

export type StableLoginFormProps = {
  /** 이메일·비밀번호 검증 후 호출. DOM과 동기화된 최종 문자열이 전달됩니다. */
  onCredentialsSubmit: (email: string, password: string) => Promise<void>;
  /** 비활성화 (부모에서 로딩 표시와 함께 사용) */
  disabled?: boolean;
  /** OAuth 등 외부에서 온 에러 (표시 후 입력 시 초기화 가능) */
  externalError?: string | null;
  onClearExternalError?: () => void;
  /** 제출 중 여부 (다른 버튼 비활성화 등) */
  onBusyChange?: (busy: boolean) => void;
};

function isValidEmailFormat(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * 모바일 자동완성·Samsung Pass 등으로 인해 React state와 DOM이 어긋나는 경우를 줄이기 위해
 * controlled 입력 + ref 동기화를 함께 사용합니다.
 */
export function StableLoginForm({
  onCredentialsSubmit,
  disabled = false,
  externalError,
  onClearExternalError,
  onBusyChange,
}: StableLoginFormProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onBusyChange?.(submitting);
  }, [submitting, onBusyChange]);

  const syncFromDom = useCallback(() => {
    const em = emailRef.current?.value ?? "";
    const pw = passwordRef.current?.value ?? "";
    setEmail(em);
    setPassword(pw);
    if (import.meta.env.DEV) {
      console.log("[StableLoginForm] syncFromDom", { emailLen: em.length, passwordLen: pw.length });
    }
    return { email: em, password: pw };
  }, []);

  const clearFieldErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setRootError(null);
    onClearExternalError?.();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled || submitting) return;

    const synced = syncFromDom();
    const emailTrim = synced.email.trim();
    const passwordRaw = synced.password;

    clearFieldErrors();

    if (!emailTrim) {
      setEmailError("이메일을 입력해 주세요.");
      return;
    }
    if (!isValidEmailFormat(emailTrim)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    if (!passwordRaw) {
      setPasswordError("비밀번호를 입력해 주세요.");
      return;
    }

    const last = syncFromDom();
    const finalEmail = last.email.trim();
    const finalPassword = last.password;

    setSubmitting(true);
    try {
      await onCredentialsSubmit(finalEmail, finalPassword);
    } catch {
      setRootError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = disabled || submitting;
  const showRoot = rootError || externalError;

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div>
        <label className="text-base font-medium text-slate-800" htmlFor="stable-login-email">
          이메일
        </label>
        <input
          id="stable-login-email"
          ref={emailRef}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username email"
          className={cn(loginInputClass, "mt-1")}
          value={email}
          disabled={busy}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
            setRootError(null);
            onClearExternalError?.();
          }}
          onInput={(e) => {
            setEmail((e.target as HTMLInputElement).value);
          }}
        />
        {emailError ? <p className="mt-1.5 text-sm text-red-600">{emailError}</p> : null}
      </div>
      <div>
        <label className="text-base font-medium text-slate-800" htmlFor="stable-login-password">
          비밀번호
        </label>
        <input
          id="stable-login-password"
          ref={passwordRef}
          name="password"
          type="password"
          autoComplete="current-password"
          className={cn(loginInputClass, "mt-1")}
          value={password}
          disabled={busy}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
            setRootError(null);
            onClearExternalError?.();
          }}
          onInput={(e) => {
            setPassword((e.target as HTMLInputElement).value);
          }}
        />
        {passwordError ? <p className="mt-1.5 text-sm text-red-600">{passwordError}</p> : null}
      </div>
      {showRoot ? (
        <p className="text-sm text-red-600" role="alert">
          {rootError ?? externalError}
        </p>
      ) : null}
      <Button type="submit" className="w-full min-h-[52px] sm:min-h-12" size="lg" loading={busy} disabled={busy}>
        로그인
      </Button>
    </form>
  );
}
