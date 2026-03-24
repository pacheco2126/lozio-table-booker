import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Force type cache invalidation
createRoot(document.getElementById("root")!).render(<App />);
