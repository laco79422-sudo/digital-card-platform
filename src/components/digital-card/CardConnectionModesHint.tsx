import { cn } from "@/lib/utils";

type Props = {
  variant: "light" | "dark";
  className?: string;
};

/**
 * NFC · QR · 링크로 명함을 열 수 있다는 사실을 부담 없이 알려 주는 보조 문구 (히어로·랜딩 카드 하단).
 */
export function CardConnectionModesHint({ variant, className }: Props) {
  const sepCls = variant === "dark" ? "text-white/40" : "text-[#888888]";
  const baseCls =
    variant === "dark"
      ? "text-[12px] leading-snug text-white/70 sm:text-[13px]"
      : "text-[12px] leading-snug text-[#666666] sm:text-[13px]";
  const hintCls =
    variant === "dark"
      ? "cursor-help underline decoration-dotted decoration-white/35 underline-offset-[3px]"
      : "cursor-help underline decoration-dotted decoration-[#bbbbbb] underline-offset-[3px]";

  return (
    <p className={cn("text-center", baseCls, className)} role="note">
      <span title="가까이 대면 바로 명함이 열립니다" className={hintCls}>
        NFC 터치
      </span>
      <span className={cn("mx-1 select-none", sepCls)} aria-hidden>
        ·
      </span>
      <span title="카메라로 스캔하면 바로 연결됩니다" className={hintCls}>
        QR 스캔
      </span>
      <span className={cn("mx-1 select-none", sepCls)} aria-hidden>
        ·
      </span>
      <span title="링크를 받은 사람도 같은 명함으로 연결됩니다">링크 공유</span>
    </p>
  );
}
