import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import AdminManualReservation from "@/components/AdminManualReservation";
import FloorPlan from "@/components/FloorPlan";
import AdminCustomers from "@/components/AdminCustomers";
import AdminReports from "@/components/AdminReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tableNames, setTableNames] = useState<Record<string, string>>({});

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

  const filtered = reservations.filter((r) => {
    if (filterLocation !== "all" && r.location !== filterLocation) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const headers = ["date","time","location","client","contact","guests","table","status","actions"].map(
    (h) => t(`admin.tableHeaders.${h}`)
  );

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t("admin.total"), count: reservations.length },
                { label: t("admin.pending"), count: reservations.filter((r) => r.status === "pending").length },
                { label: t("admin.confirmed"), count: reservations.filter((r) => r.status === "confirmed").length },
                { label: t("admin.cancelled"), count: reservations.filter((r) => r.status === "cancelled").length },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-lg p-5 border border-border shadow-sm">
                  <p className="text-muted-foreground font-body text-sm">{s.label}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{s.count}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
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
            </div>

            {filtered.length === 0 ? (
              <div className="bg-card rounded-lg p-12 border border-border text-center">
                <p className="text-muted-foreground font-body text-lg">{t("admin.noReservations")}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {headers.map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-body font-bold text-foreground uppercase tracking-wider text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const st = statusLabels[r.status] || statusLabels.pending;
                        return (
                          <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-body text-foreground whitespace-nowrap">{r.reservation_date}</td>
                            <td className="px-4 py-3 font-body text-foreground whitespace-nowrap">{r.reservation_time}</td>
                            <td className="px-4 py-3 font-body text-foreground whitespace-nowrap">{locationNames[r.location] || r.location}</td>
                            <td className="px-4 py-3 font-body text-foreground font-bold">{r.guest_name}</td>
                            <td className="px-4 py-3 font-body text-muted-foreground"><div>{r.phone}</div></td>
                            <td className="px-4 py-3 font-body text-foreground text-center">{r.guests}</td>
                            <td className="px-4 py-3 font-body text-foreground whitespace-nowrap">{r.table_id ? tableNames[r.table_id] || "—" : "—"}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-sm text-xs font-bold font-body ${st.className}`}>{st.label}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {r.status !== "cancelled" && (
                                  <button onClick={() => updateStatus(r.id, "cancelled")}
                                    className="px-2 py-1 text-xs font-body font-bold bg-destructive/20 text-destructive rounded-sm hover:bg-destructive/30 transition-colors">
                                    {t("admin.cancel")}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map((r) => {
                    const st = statusLabels[r.status] || statusLabels.pending;
                    return (
                      <div key={r.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-body font-bold text-foreground">{r.guest_name}</p>
                            <p className="text-xs text-muted-foreground font-body">{locationNames[r.location] || r.location}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-body ${st.className}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-body text-foreground">
                          <span>{r.reservation_date}</span>
                          <span className="font-bold">{r.reservation_time}</span>
                          <span>{r.guests} 👤</span>
                          {r.table_id && tableNames[r.table_id] && (
                            <span className="text-muted-foreground">🪑 {tableNames[r.table_id]}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-body">
                          <p>{r.phone}</p>
                        </div>
                        {r.notes && <p className="text-xs text-muted-foreground font-body italic">{r.notes}</p>}
                        <div className="flex gap-2 pt-1">
                          {r.status !== "cancelled" && (
                            <button onClick={() => updateStatus(r.id, "cancelled")}
                              className="flex-1 px-3 py-2.5 min-h-[44px] text-sm font-body font-bold bg-destructive/20 text-destructive rounded-md hover:bg-destructive/30 transition-colors">
                              {t("admin.cancel")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
