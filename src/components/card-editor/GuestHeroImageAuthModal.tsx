import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function GuestHeroImageAuthModal({
  open,
  onClose,
  onSignup,
  onContinueEditing,
}: {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
  onContinueEditing: () => void;
}) {
  return (
    <Modal open={open} title="회원가입 안내" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm font-medium leading-relaxed text-slate-800">등록된 회원이 아닙니다.</p>
        <p className="text-sm leading-relaxed text-slate-600">
          회원가입 후 이미지를 안전하게 저장할 수 있어요.
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          회원가입이 완료되면 이미지를 다시 선택해 저장할 수 있습니다. 명함 작성 화면으로 돌아오면 이미지 등록 안내를 표시해 드립니다.
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:flex-wrap sm:justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void onSignup()}>
            회원가입하고 이미지 저장하기
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto sm:mr-auto" onClick={onContinueEditing}>
            계속 수정하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
