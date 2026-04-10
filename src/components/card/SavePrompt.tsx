import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** 게스트 편집기: 저장 전 안내 (입력 폼 밖에서 사용) */
export function GuestSavePrompt({ className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-4 text-center sm:px-6 sm:py-5",
        className,
      )}
      role="region"
      aria-label="임시 명함 안내"
    >
      <p className="text-sm font-semibold text-amber-950">지금 만든 명함은 아직 임시 상태입니다.</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
        가입하면 내 계정에 저장하고 언제든 수정할 수 있습니다.
      </p>
    </div>
  );
}
