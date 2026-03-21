import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const UpdateBanner = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowUpdate(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleUpdate();
            }
          });
        });
      });

      // Also listen for controller change (skipWaiting activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleRefresh = () => {
    window.location.reload();
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
