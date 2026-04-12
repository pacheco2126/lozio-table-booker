import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { CalendarIcon, ChevronDown, ChevronUp, UtensilsCrossed, MapPin, Phone, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import AdminManualReservation from "@/components/AdminManualReservation";
import FloorPlan from "@/components/FloorPlan";
import AdminCustomers from "@/components/AdminCustomers";
import AdminReports from "@/components/AdminReports";
import AdminReviews from "@/components/AdminReviews";
import AdminMedia from "@/components/AdminMedia";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { locationsData } from "@/lib/locations";

interface Reservation {
  id: string; location: string; guest_name: string; email: string; phone: string;
  reservation_date: string; reservation_time: string; guests: string;
  notes: string | null; status: string; created_at: string; user_id: string | null;
  table_id: string | null;
}

const locationNames: Record<string, string> = {
  tarragona: "Lo Zio Tarragona",
  arrabassada: "Lo Zio Arrabassada",
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tableNames, setTableNames] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(!isMobile);
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [pendingToggleValue, setPendingToggleValue] = useState(false);
  const [showCancelledToday, setShowCancelledToday] = useState(false);
  const [cancelIds, setCancelIds] = useState<string[] | null>(null);
  const [cancelName, setCancelName] = useState("");

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: t("admin.statusPending"), className: "bg-accent/20 text-accent-foreground" },
    confirmed: { label: t("admin.statusConfirmed"), className: "bg-secondary/20 text-secondary" },
    cancelled: { label: t("admin.statusCancelled"), className: "bg-destructive/20 text-destructive" },
  };

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchReservations();
      fetchTableNames();
      fetchReservationsEnabled();
    } else if (!adminLoading) {
      setLoading(false);
    }
  }, [isAdmin, adminLoading]);

  const fetchReservationsEnabled = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "reservations_enabled").single();
    if (data) setReservationsEnabled(data.value === true);
  };

  const handleToggleReservations = (checked: boolean) => {
    setPendingToggleValue(checked);
    setShowToggleDialog(true);
  };

  const confirmToggleReservations = async () => {
    const { error } = await supabase.from("site_settings").update({ value: pendingToggleValue, updated_at: new Date().toISOString() }).eq("key", "reservations_enabled");
    if (error) {
      toast.error("Error al actualizar el estado de las reservas");
    } else {
      setReservationsEnabled(pendingToggleValue);
      toast.success(pendingToggleValue ? "Reservas activadas" : "Reservas desactivadas");
    }
    setShowToggleDialog(false);
  };

  const fetchReservations = async () => {
    const { data, error } = await supabase.from("reservations").select("*").order("reservation_date", { ascending: true }).order("reservation_time", { ascending: true });
    if (error) { toast.error(t("admin.loadError")); } else { setReservations((data as Reservation[]) || []); }
    setLoading(false);
  };

  const fetchTableNames = async () => {
    const { data } = await supabase.from("tables").select("id, name");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((t: any) => { map[t.id] = t.name; });
      setTableNames(map);
    }
  };

  const updateStatus = async (ids: string | string[], status: string) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const { error } = await supabase.from("reservations").update({ status }).in("id", idArray);
    if (error) { toast.error(t("admin.statusError")); } else { toast.success(t("admin.statusUpdated")); fetchReservations(); }
  };

  // Dates that have reservations (for calendar dots)
  const reservationDates = useMemo(() => {
    const dates = new Set<string>();
    reservations.forEach((r) => {
      if (r.status !== "cancelled") dates.add(r.reservation_date);
    });
    return dates;
  }, [reservations]);

  // Group key for multi-table reservations
  const getGroupKey = (r: Reservation) =>
    `${r.guest_name}|${r.reservation_date}|${r.reservation_time}|${r.location}|${r.phone}`;

  interface GroupedReservation extends Reservation {
    tableIds: string[];
    allIds: string[];
  }

  // Filtered and grouped reservations for selected date
  const filteredForDate = useMemo(() => {
    const selStr = format(selectedDate, "yyyy-MM-dd");
    const isTodaySelected = selStr === format(new Date(), "yyyy-MM-dd");
    const filtered = reservations.filter((r) => {
      if (r.reservation_date !== selStr) return false;
      if (filterLocation !== "all" && r.location !== filterLocation) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (isTodaySelected && !showCancelledToday && r.status === "cancelled") return false;
      return true;
    });

    // Group by guest+date+time+location+phone, but only if created within 10s of each other (multi-table)
    const groups = new Map<string, GroupedReservation>();
    filtered.forEach((r) => {
      const key = getGroupKey(r);
      const existing = groups.get(key);
      if (existing) {
        // Only group if created_at is within 10 seconds (same multi-table booking)
        const existingTime = new Date(existing.created_at).getTime();
        const currentTime = new Date(r.created_at).getTime();
        if (Math.abs(existingTime - currentTime) <= 10000) {
          if (r.table_id) existing.tableIds.push(r.table_id);
          existing.allIds.push(r.id);
        } else {
          // Separate reservation, use a unique key
          const uniqueKey = `${key}|${r.id}`;
          groups.set(uniqueKey, {
            ...r,
            tableIds: r.table_id ? [r.table_id] : [],
            allIds: [r.id],
          });
        }
      } else {
        groups.set(key, {
          ...r,
          tableIds: r.table_id ? [r.table_id] : [],
          allIds: [r.id],
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
  }, [reservations, selectedDate, filterLocation, filterStatus, showCancelledToday]);

  const cancelledTodayCount = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return reservations.filter((r) => r.reservation_date === todayStr && r.status === "cancelled" &&
      (filterLocation === "all" || r.location === filterLocation)).length;
  }, [reservations, filterLocation]);

  const handleDateSelect = (d: Date | undefined) => {
    if (d) setSelectedDate(d);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  if (authLoading || adminLoading || loading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-body">{t("profile.loadingText")}</p></div>);
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{t("admin.accessDenied")}</h1>
          <p className="text-muted-foreground font-body mb-6">{t("admin.noPermission")}</p>
          <a href="/" className="text-primary font-body hover:underline">{t("admin.backHome")}</a>
        </div>
      </div>
    );
  }

  const formatDateHeader = (dateStr: string) => {
    const d = parseISO(dateStr);
    return format(d, "EEEE d 'de' MMMM", { locale: es });
  };

  const renderReservationCard = (r: GroupedReservation) => {
    const st = statusLabels[r.status] || statusLabels.pending;
    const tableLabel = r.tableIds
      .map((id) => tableNames[id])
      .filter(Boolean)
      .join(" + ");
    return (
      <div key={r.allIds.join("-")} className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-center shrink-0 w-14">
            <p className="font-display text-lg font-bold text-foreground leading-none">{r.reservation_time.substring(0, 5)}</p>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body font-bold text-foreground truncate">{r.guest_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-0.5">
              <span>{r.guests} 👤</span>
              {tableLabel && <span>🪑 {tableLabel}</span>}
              <span>{r.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-body ${st.className}`}>{st.label}</span>
          {r.status !== "cancelled" && (
            <button onClick={() => { setCancelIds(r.allIds); setCancelName(r.guest_name); }}
              className="px-2 py-1 text-xs font-body font-bold bg-destructive/20 text-destructive rounded-sm hover:bg-destructive/30 transition-colors">
              {t("admin.cancel")}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDateGroup = (dateStr: string, items: GroupedReservation[], isHighlighted = false) => {
    const dateLabel = formatDateHeader(dateStr);
    const isTodayDate = dateStr === format(new Date(), "yyyy-MM-dd");
    return (
      <div key={dateStr} className="space-y-2">
        <div className={`flex items-center gap-3 py-2 px-1 ${isHighlighted ? '' : ''}`}>
          <h3 className={`font-display text-sm font-bold uppercase tracking-wider ${isTodayDate ? 'text-primary' : 'text-foreground'}`}>
            {isTodayDate ? 'Hoy' : ''} — {dateLabel}
          </h3>
          <Badge variant={isTodayDate ? "default" : "secondary"} className="text-xs">
            {items.length} {items.length === 1 ? 'reserva' : 'reservas'}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map(renderReservationCard)}
        </div>
      </div>
    );
  };

  const totalActive = filteredForDate.filter(r => r.status !== "cancelled").length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar forceSolid />
      <div className="pt-24 md:pt-28 pb-16 px-3 md:px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground">{t("admin.title")}</h1>
            <p className="text-muted-foreground font-body mt-1 md:mt-2 text-sm">{t("admin.subtitle")}</p>
          </div>
          <AdminManualReservation onCreated={fetchReservations} />
        </div>

        <Tabs defaultValue="reservations" className="space-y-6">
          <TabsList className="font-body">
            <TabsTrigger value="reservations" className="font-bold">{t("admin.reservations")}</TabsTrigger>
            <TabsTrigger value="floorplan" className="font-bold">{t("admin.floorPlan")}</TabsTrigger>
            <TabsTrigger value="reports" className="font-bold">{t("admin.reports.title")}</TabsTrigger>
            <TabsTrigger value="reviews" className="font-bold">Reseñas</TabsTrigger>
            <TabsTrigger value="customers" className="font-bold">{t("admin.customers")}</TabsTrigger>
            <TabsTrigger value="media" className="font-bold">📷 Media</TabsTrigger>
            <TabsTrigger value="orders" className="font-bold">🍕 Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-6">
            {/* Toggle reservas */}
            <div className="flex items-center justify-between bg-card rounded-lg p-4 border border-border shadow-sm">
              <div>
                <p className="font-body font-bold text-foreground text-sm">
                  {reservationsEnabled ? "Reservas activas" : "Reservas desactivadas"}
                </p>
                <p className="text-muted-foreground font-body text-xs mt-0.5">
                  {reservationsEnabled ? "Los usuarios pueden hacer reservas online" : "Las reservas online están pausadas"}
                </p>
              </div>
              <Switch
                checked={reservationsEnabled}
                onCheckedChange={handleToggleReservations}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t("admin.total"), count: totalActive },
                { label: t("admin.pending"), count: filteredForDate.filter((r) => r.status === "pending").length },
                { label: t("admin.confirmed"), count: filteredForDate.filter((r) => r.status === "confirmed").length },
                { label: t("admin.cancelled"), count: filteredForDate.filter((r) => r.status === "cancelled").length },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-lg p-5 border border-border shadow-sm">
                  <p className="text-muted-foreground font-body text-sm">{s.label}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{s.count}</p>
                </div>
              ))}
            </div>

            {/* Calendar + Filters */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar */}
              <div className="lg:w-auto shrink-0">
                {isMobile ? (
                  <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-body text-sm">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(selectedDate, "EEE d MMM", { locale: es })}
                        </span>
                        {calendarOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-card border border-border rounded-lg p-2">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          locale={es}
                          className={cn("p-3 pointer-events-auto")}
                          modifiers={{ hasReservation: (d) => reservationDates.has(format(d, "yyyy-MM-dd")) }}
                          modifiersClassNames={{ hasReservation: "reservation-dot", today: "!bg-primary !text-primary-foreground" }}
                        />
                        <div className="px-3 pb-2">
                          <Button size="sm" variant="outline" onClick={handleGoToToday} className="w-full font-body font-bold text-xs">
                            Hoy
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      locale={es}
                      className={cn("p-3 pointer-events-auto")}
                      modifiers={{ hasReservation: (d) => reservationDates.has(format(d, "yyyy-MM-dd")) }}
                      modifiersClassNames={{ hasReservation: "reservation-dot", today: "!bg-primary !text-primary-foreground" }}
                    />
                    <div className="px-3 pb-2">
                      <Button size="sm" variant="outline" onClick={handleGoToToday} className="w-full font-body font-bold text-xs">
                        Hoy
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reservation list */}
              <div className="flex-1 space-y-6 min-w-0">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-4 py-2 rounded-sm bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">{t("admin.allLocations")}</option>
                    <option value="tarragona">Lo Zio Tarragona</option>
                    <option value="arrabassada">Lo Zio Arrabassada</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-sm bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">{t("admin.allStatuses")}</option>
                    <option value="pending">{t("admin.pending")}</option>
                    <option value="confirmed">{t("admin.confirmed")}</option>
                    <option value="cancelled">{t("admin.cancelled")}</option>
                  </select>
                  {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && cancelledTodayCount > 0 && filterStatus === "all" && (
                    <Button
                      size="sm"
                      variant={showCancelledToday ? "secondary" : "outline"}
                      onClick={() => setShowCancelledToday(!showCancelledToday)}
                      className="font-body text-xs"
                    >
                      {showCancelledToday ? "Ocultar canceladas" : `Mostrar canceladas (${cancelledTodayCount})`}
                    </Button>
                  )}
                  {format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
                    <Button size="sm" variant="ghost" onClick={handleGoToToday} className="font-body text-xs text-primary">
                      ✕ Volver a hoy
                    </Button>
                  )}
                </div>

                {/* Reservations for selected date */}
                {filteredForDate.length > 0 ? (
                  renderDateGroup(format(selectedDate, "yyyy-MM-dd"), filteredForDate, format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
                ) : (
                  <div className="bg-card rounded-lg p-12 border border-border text-center">
                    <p className="text-muted-foreground font-body text-lg">{t("admin.noReservations")}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="floorplan"><FloorPlan /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="reviews"><AdminReviews /></TabsContent>
          <TabsContent value="customers"><AdminCustomers /></TabsContent>
          <TabsContent value="media"><AdminMedia /></TabsContent>
          <TabsContent value="orders">
            <div className="space-y-4">
              <p className="text-muted-foreground font-body text-sm">
                Selecciona un local para ver y gestionar sus pedidos en tiempo real.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {["tarragona", "arrabassada"].map((slug) => {
                  const loc = locationsData[slug];
                  return (
                    <a
                      key={slug}
                      href={`/admin/pedidos/${slug}`}
                      className="block bg-card border border-border rounded-xl p-5 hover:border-menu-teal hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-lg text-foreground mb-1 group-hover:text-menu-teal transition-colors">
                            {loc.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{loc.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{loc.phone}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-menu-teal transition-colors mt-1 shrink-0" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggleValue ? "¿Activar reservas?" : "¿Desactivar reservas?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggleValue
                ? "Los usuarios podrán volver a hacer reservas online."
                : "Los usuarios no podrán hacer nuevas reservas hasta que las reactives."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleReservations}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!cancelIds} onOpenChange={(open) => { if (!open) setCancelIds(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reserva de {cancelName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la reserva. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cancelIds) updateStatus(cancelIds, "cancelled"); setCancelIds(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
