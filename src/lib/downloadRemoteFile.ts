/** 원격 이미지 등을 파일로 저장 시도 (CORS 허용 시 blob 다운로드) */
export async function downloadRemoteFile(url: string, filename: string): Promise<boolean> {
  const safeName = filename.replace(/[^\w.\-가-힣]+/g, "_").slice(0, 120);
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = safeName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
    }
    return false;
  }
}
