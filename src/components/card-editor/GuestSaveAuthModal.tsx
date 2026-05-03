import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function GuestSaveAuthModal({
  open,
  onClose,
  onSignup,
  onLogin,
  onContinueEditing,
}: {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
  onLogin: () => void;
  onContinueEditing: () => void;
}) {
  return (
    <Modal open={open} title="명함을 저장하려면 회원가입이 필요해요" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">
          지금 입력한 내용은 임시저장됩니다.
          <br />
          회원가입이 끝나면 내 공간에 자동으로 저장됩니다.
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:flex-wrap sm:justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void onSignup()}>
            회원가입하고 저장하기
          </Button>
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => void onLogin()}>
            로그인하고 저장하기
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto sm:mr-auto" onClick={onContinueEditing}>
            계속 수정하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
