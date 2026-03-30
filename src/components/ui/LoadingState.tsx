export function LoadingState({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}
