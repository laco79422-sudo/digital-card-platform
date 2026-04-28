import QRCode from "qrcode";

/** 고해상도 QR PNG data URL */
export async function generateQrPngDataUrl(targetUrl: string): Promise<string> {
  const url = targetUrl.trim();
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
