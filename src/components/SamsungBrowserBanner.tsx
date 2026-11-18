import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chrome, X, Copy } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "lozio-samsung-banner-dismissed";

/**
 * Detects Samsung Internet (and other non-Chrome Android browsers known to
 * generate outdated WebAPKs) and suggests opening the site in Chrome so the
 * "app built for an older Android version" warning does not appear when the
 * user installs the PWA.
 */
const SamsungBrowserBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    if (!isAndroid) return;

    // Samsung Internet → "SamsungBrowser/x.y"
    // Other browsers known to ship stale WebAPKs on Android
    const flagged = /SamsungBrowser|MiuiBrowser|HuaweiBrowser|YaBrowser|OPR\//i.test(ua);
    if (!flagged) return;

    // Standalone (already installed) → no need to nag
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS only
      window.navigator.standalone === true;
    if (isStandalone) return;

    setShow(true);
  }, []);

  if (!show) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleOpenChrome = () => {
    // Android intent → opens current URL directly in Chrome if installed,
    // otherwise sends the user to the Play Store listing for Chrome.
    const u = new URL(url);
    const intent =
      `intent://${u.host}${u.pathname}${u.search}` +
      `#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(
        "https://play.google.com/store/apps/details?id=com.android.chrome",
      )};end`;
    window.location.href = intent;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado. Pégalo en Chrome.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-start gap-3">
        <Chrome className="h-5 w-5 mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1 text-sm">
          <p className="font-semibold leading-tight">
            Para instalar la app sin avisos
          </p>
          <p className="opacity-90 leading-snug mt-0.5">
            Tu navegador puede generar una versión antigua de la app. Ábrela en
            Chrome para instalarla de forma segura.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleOpenChrome}
              className="h-8"
            >
              <Chrome className="h-4 w-4 mr-1" /> Abrir en Chrome
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Copy className="h-4 w-4 mr-1" /> Copiar enlace
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="p-1 -m-1 opacity-80 hover:opacity-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SamsungBrowserBanner;
