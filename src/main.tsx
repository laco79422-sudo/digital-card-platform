import "@/index.css";
import App from "@/App";
import { AppErrorBoundary } from "@/components/errors/AppErrorBoundary";
import { initKakao } from "@/lib/kakao";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

initKakao();

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

createRoot(el).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
