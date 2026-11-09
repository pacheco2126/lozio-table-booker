import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Benign browser warning (fired by Radix/menus resizing); stop it from surfacing as a crash.
const isResizeObserverNoise = (msg?: string) =>
  !!msg && msg.includes("ResizeObserver loop");
window.addEventListener(
  "error",
  (e) => {
    if (isResizeObserverNoise(e.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  },
  true,
);

createRoot(document.getElementById("root")!).render(<App />);
