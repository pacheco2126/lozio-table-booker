import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, isBefore, startOfDay, parseISO, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import AdminManualReservation from "@/components/AdminManualReservation";
import FloorPlan from "@/components/FloorPlan";
import AdminCustomers from "@/components/AdminCustomers";
import AdminReports from "@/components/AdminReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showPast, setShowPast] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(!isMobile);

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
    } else if (!adminLoading) {
      setLoading(false);
    }
  }, [isAdmin, adminLoading]);

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

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
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

  // Filtered reservations
  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (filterLocation !== "all" && r.location !== filterLocation) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [reservations, filterLocation, filterStatus]);

  // Group reservations
  const { todayReservations, futureGroups, pastReservations } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayStart = startOfDay(new Date());

    if (selectedDate) {
      const selStr = format(selectedDate, "yyyy-MM-dd");
      const selected = filtered.filter((r) => r.reservation_date === selStr);
      if (selStr === today) {
        return { todayReservations: selected, futureGroups: {} as Record<string, Reservation[]>, pastReservations: [] as Reservation[] };
      }
      if (isBefore(parseISO(selStr), todayStart)) {
        return { todayReservations: [] as Reservation[], futureGroups: {} as Record<string, Reservation[]>, pastReservations: selected };
      }
      return { todayReservations: [] as Reservation[], futureGroups: { [selStr]: selected }, pastReservations: [] as Reservation[] };
    }

    const todayRes = filtered.filter((r) => r.reservation_date === today);
    const future: Record<string, Reservation[]> = {};
    const past: Reservation[] = [];

    filtered.forEach((r) => {
      if (r.reservation_date === today) return;
      const rDate = parseISO(r.reservation_date);
      if (isBefore(rDate, todayStart)) {
        past.push(r);
      } else {
        if (!future[r.reservation_date]) future[r.reservation_date] = [];
        future[r.reservation_date].push(r);
      }
    });

    past.sort((a, b) => b.reservation_date.localeCompare(a.reservation_date) || b.reservation_time.localeCompare(a.reservation_time));

    return { todayReservations: todayRes, futureGroups: future, pastReservations: past };
  }, [filtered, selectedDate]);

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
  };

  const handleGoToToday = () => {
    setSelectedDate(undefined);
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

  const renderReservationCard = (r: Reservation) => {
    const st = statusLabels[r.status] || statusLabels.pending;
    return (
      <div key={r.id} className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-center shrink-0 w-14">
            <p className="font-display text-lg font-bold text-foreground leading-none">{r.reservation_time.substring(0, 5)}</p>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body font-bold text-foreground truncate">{r.guest_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-0.5">
              <span>{r.guests} 👤</span>
              {r.table_id && tableNames[r.table_id] && <span>🪑 {tableNames[r.table_id]}</span>}
              <span>{r.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-body ${st.className}`}>{st.label}</span>
          {r.status !== "cancelled" && (
            <button onClick={() => updateStatus(r.id, "cancelled")}
              className="px-2 py-1 text-xs font-body font-bold bg-destructive/20 text-destructive rounded-sm hover:bg-destructive/30 transition-colors">
              {t("admin.cancel")}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDateGroup = (dateStr: string, items: Reservation[], isHighlighted = false) => {
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

  const totalActive = filtered.filter(r => r.status !== "cancelled").length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
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
            <TabsTrigger value="customers" className="font-bold">{t("admin.customers")}</TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t("admin.total"), count: totalActive },
                { label: t("admin.pending"), count: filtered.filter((r) => r.status === "pending").length },
                { label: t("admin.confirmed"), count: filtered.filter((r) => r.status === "confirmed").length },
                { label: t("admin.cancelled"), count: filtered.filter((r) => r.status === "cancelled").length },
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
                          {selectedDate ? format(selectedDate, "EEE d MMM", { locale: es }) : 'Hoy — ' + format(new Date(), "d MMM", { locale: es })}
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
                  {selectedDate && (
                    <Button size="sm" variant="ghost" onClick={handleGoToToday} className="font-body text-xs text-primary">
                      ✕ Quitar filtro de fecha
                    </Button>
                  )}
                </div>

                {/* Today's reservations */}
                {todayReservations.length > 0 && (
                  <>
                    {renderDateGroup(format(new Date(), "yyyy-MM-dd"), todayReservations, true)}
                    {Object.keys(futureGroups).length > 0 && (
                      <div className="border-t-2 border-primary/20 my-4" />
                    )}
                  </>
                )}

                {/* Future reservations grouped by date */}
                {Object.keys(futureGroups).sort().map((dateStr) => (
                  renderDateGroup(dateStr, futureGroups[dateStr])
                ))}

                {/* Empty state */}
                {todayReservations.length === 0 && Object.keys(futureGroups).length === 0 && pastReservations.length === 0 && (
                  <div className="bg-card rounded-lg p-12 border border-border text-center">
                    <p className="text-muted-foreground font-body text-lg">{t("admin.noReservations")}</p>
                  </div>
                )}

                {/* Past reservations collapsible */}
                {!selectedDate && pastReservations.length > 0 && (
                  <Collapsible open={showPast} onOpenChange={setShowPast}>
                    <div className="border-t border-border pt-4 mt-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between font-body text-sm text-muted-foreground">
                          <span>Ver reservas pasadas ({pastReservations.length})</span>
                          {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-6">
                        {(() => {
                          const pastGroups: Record<string, Reservation[]> = {};
                          pastReservations.forEach((r) => {
                            if (!pastGroups[r.reservation_date]) pastGroups[r.reservation_date] = [];
                            pastGroups[r.reservation_date].push(r);
                          });
                          return Object.keys(pastGroups).sort().reverse().map((dateStr) =>
                            renderDateGroup(dateStr, pastGroups[dateStr])
                          );
                        })()}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="floorplan"><FloorPlan /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="customers"><AdminCustomers /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
