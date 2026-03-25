import { useState, useEffect, useCallback } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

const UpdateBanner = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  const triggerUpdate = useCallback(() => setShowUpdate(true), []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    // Listen for controllerchange → auto-reload
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Watch for new SW installations
    navigator.serviceWorker.ready.then((registration) => {
      // If a waiting worker already exists (e.g. from a previous visit)
      if (registration.waiting) {
        triggerUpdate();
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            triggerUpdate();
          }
        });
      });
    });

    // Periodically check for updates
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [triggerUpdate]);

  const handleRefresh = () => {
    // Tell the waiting SW to activate, then reload
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    // Fallback: just reload after a short delay
    setTimeout(() => window.location.reload(), 300);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] bg-accent text-accent-foreground px-4 py-3 flex items-center justify-between gap-3 shadow-lg animate-fade-in-up">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <RefreshCw className="w-5 h-5 shrink-0" />
        <span className="text-sm font-body font-medium truncate">
          Nueva versión disponible
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 px-3 text-xs font-bold"
          onClick={handleRefresh}
        >
          Actualizar ahora
        </Button>
        <button
          onClick={() => setShowUpdate(false)}
          className="p-1 rounded-sm hover:bg-accent-foreground/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
