import App from "@/App";
import "@/index.css";
import { loadSiteContent } from "@/lib/content";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

//prefetch
export const contentPreload = loadSiteContent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
