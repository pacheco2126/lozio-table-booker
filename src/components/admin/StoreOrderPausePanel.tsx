import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const StoreOrderPausePanel = ({ store, storeName }: Props) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeStorePauses(() => setTick((t) => t + 1)), []);

  const state = getStorePauseState(store);
  const paused = isStorePaused(store);
  const until = paused && state.until ? new Date(state.until) : null;

  const activeOption: PauseOption = !paused
    ? "1h"
    : state.until === null
      ? "indefinite"
      : until && until.getTime() - Date.now() <= 65 * 60 * 1000
        ? "1h"
        : "today";

  const apply = async (option: PauseOption | null) => {
    setSaving(true);
    const { error } = await setStorePause(store, option);
    setSaving(false);
    if (error) {
      toast.error(t("admin.pauseOrders.error"));
      return;
    }
    toast.success(
      option === null
        ? t("admin.pauseOrders.resumeSuccess", { storeName })
        : t("admin.pauseOrders.pauseSuccess", { storeName }),
    );
  };

  const handleToggle = (v: boolean) => {
    apply(v ? activeOption : null);
  };

  const handleOptionChange = (value: PauseOption) => {
    if (!paused) {
      // If not paused, selecting an option also activates the pause
      apply(value);
    } else {
      apply(value);
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 mb-6 ${
        paused ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        {paused ? (
          <PauseCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
        ) : (
          <PlayCircle className="w-5 h-5 text-menu-teal mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">
            {paused ? t("admin.pauseOrders.titlePaused") : t("admin.pauseOrders.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {paused
              ? until
                ? t("admin.pauseOrders.pauseUntil", {
                    time: format(until, "HH:mm", { locale: es }),
                  }) + " — " + t("admin.pauseOrders.descriptionPaused")
                : t("admin.pauseOrders.indefinite") + " — " + t("admin.pauseOrders.descriptionPaused")
              : t("admin.pauseOrders.description")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">
          {t("admin.pauseOrders.toggleLabel")}
        </span>
        <Switch checked={paused} disabled={saving} onCheckedChange={handleToggle} />
      </div>

      {paused && (
        <div className="mt-3">
          <Select value={activeOption} onValueChange={handleOptionChange} disabled={saving}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("admin.pauseOrders.option1h")}</p>
                    <p className="text-xs text-muted-foreground">{t("admin.pauseOrders.option1hHint")}</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="today">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("admin.pauseOrders.optionToday")}</p>
                    <p className="text-xs text-muted-foreground">{t("admin.pauseOrders.optionTodayHint")}</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="indefinite">
                <div className="flex items-center gap-2">
                  <InfinityIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("admin.pauseOrders.optionIndefinite")}</p>
                    <p className="text-xs text-muted-foreground">{t("admin.pauseOrders.optionIndefiniteHint")}</p>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default StoreOrderPausePanel;
