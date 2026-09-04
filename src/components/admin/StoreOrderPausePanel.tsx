import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { PauseCircle, PlayCircle, Clock, Moon, Infinity as InfinityIcon } from "lucide-react";
import {
  getStorePauseState,
  isStorePaused,
  setStorePause,
  subscribeStorePauses,
  type PauseOption,
} from "@/lib/storePause";

interface Props {
  store: string;
  storeName: string;
}

const OPTIONS: { value: PauseOption; label: string; hint: string; icon: typeof Clock }[] = [
  { value: "1h", label: "Durante 1 hora", hint: "Se reactiva automáticamente", icon: Clock },
  { value: "today", label: "Todo el día", hint: "Hasta el cierre del local (23:30)", icon: Moon },
  { value: "indefinite", label: "Indefinido", hint: "Hasta que lo reactives manualmente", icon: InfinityIcon },
];

const StoreOrderPausePanel = ({ store, storeName }: Props) => {
  const [, setTick] = useState(0);
  const [saving, setSaving] = useState<PauseOption | "resume" | null>(null);

  useEffect(() => subscribeStorePauses(() => setTick((t) => t + 1)), []);

  const state = getStorePauseState(store);
  const paused = isStorePaused(store);
  const until = paused && state.until ? new Date(state.until) : null;

  const activeOption: PauseOption | null = !paused
    ? null
    : state.until === null
      ? "indefinite"
      : until && until.getTime() - Date.now() <= 65 * 60 * 1000
        ? "1h"
        : "today";

  const apply = async (option: PauseOption | null) => {
    setSaving(option ?? "resume");
    const { error } = await setStorePause(store, option);
    setSaving(null);
    if (error) {
      toast.error("No se pudo actualizar el estado del local");
      return;
    }
    toast.success(
      option === null
        ? `${storeName} vuelve a recibir pedidos`
        : `${storeName} ha dejado de recibir pedidos`,
    );
  };

  return (
    <div
      className={`rounded-xl border p-4 mb-6 ${
        paused ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {paused ? (
          <PauseCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
        ) : (
          <PlayCircle className="w-5 h-5 text-menu-teal mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">
            {paused ? "No se están recibiendo pedidos" : "Recibiendo pedidos"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {paused
              ? until
                ? `Pausado hasta las ${format(until, "HH:mm", { locale: es })} — el local aparece como cerrado (sin recogida ni reparto asignado).`
                : "Pausa indefinida — el local aparece como cerrado (sin recogida ni reparto asignado)."
              : "Puedes pausar temporalmente la entrada de pedidos en este local."}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const checked = activeOption === opt.value;
          return (
            <div
              key={opt.value}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.hint}</p>
              </div>
              <Switch
                checked={checked}
                disabled={saving !== null}
                onCheckedChange={(v) => apply(v ? opt.value : null)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoreOrderPausePanel;
