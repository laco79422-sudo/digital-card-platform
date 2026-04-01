import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ImageIcon, Trash2 } from "lucide-react";
import { useId, useRef } from "react";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

type Props = {
  label?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string;
};

function isAllowedImage(file: File): boolean {
  if (file.size > MAX_BYTES) return false;
  const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const okName = /\.(jpe?g|png|webp)$/i.test(file.name);
  return okType || okName;
}

export function ImageUploader({ label = "브랜드 대표 이미지", value, onChange, error }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedImage(file)) {
      window.alert("jpg, jpeg, png, webp 형식이며 4MB 이하만 업로드할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      onChange(typeof r === "string" ? r : null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-base font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      <p className="text-xs text-slate-500">jpg · jpeg · png · webp · 최대 4MB</p>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onPick}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" className="min-h-11" onClick={() => inputRef.current?.click()}>
          파일 선택
        </Button>
        {value ? (
          <>
            <div
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50",
              )}
            >
              <img src={value} alt="" className="h-full w-full object-cover object-center" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onChange(null)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
              삭제
            </Button>
          </>
        ) : (
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            등록된 이미지 없음
          </span>
        )}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
