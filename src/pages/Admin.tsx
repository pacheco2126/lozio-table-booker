import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import AdminManualReservation from "@/components/AdminManualReservation";

interface Reservation {
  id: string;
  location: string;
  guest_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: string;
  notes: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
}

const locationNames: Record<string, string> = {
  tarragona: "Lo Zio Tarragona",
  arrabassada: "Lo Zio Arrabassada",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-accent/20 text-accent-foreground" },
  confirmed: { label: "Confirmada", className: "bg-secondary/20 text-secondary" },
  cancelled: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "admin")
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchReservations();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (error) {
      toast.error("Error al cargar las reservas");
      console.error(error);
    } else {
      setReservations((data as Reservation[]) || []);
    }
    setLoading(false);
  };

  const confirmReservation = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("confirm-reservation", {
        body: { reservation_id: id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Reserva confirmada - WhatsApp enviado al cliente");
      fetchReservations();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al confirmar la reserva");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar el estado");
    } else {
      toast.success("Estado actualizado");
      fetchReservations();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Acceso denegado</h1>
          <p className="text-muted-foreground font-body mb-6">No tienes permisos de administrador.</p>
          <a href="/" className="text-primary font-body hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  const filtered = reservations.filter((r) => {
    if (filterLocation !== "all" && r.location !== filterLocation) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground font-body mt-2">
              Gestiona las reservas de tus restaurantes
            </p>
          </div>
          <AdminManualReservation onCreated={fetchReservations} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", count: reservations.length },
            { label: "Pendientes", count: reservations.filter((r) => r.status === "pending").length },
            { label: "Confirmadas", count: reservations.filter((r) => r.status === "confirmed").length },
            { label: "Canceladas", count: reservations.filter((r) => r.status === "cancelled").length },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-lg p-5 border border-border shadow-sm">
              <p className="text-muted-foreground font-body text-sm">{s.label}</p>
              <p className="font-display text-3xl font-bold text-foreground">{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 rounded-sm bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los locales</option>
            <option value="tarragona">Lo Zio Tarragona</option>
            <option value="arrabassada">Lo Zio Arrabassada</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-sm bg-background border border-input font-body text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        {/* Reservations table */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-lg p-12 border border-border text-center">
            <p className="text-muted-foreground font-body text-lg">No hay reservas para mostrar</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Fecha", "Hora", "Local", "Cliente", "Contacto", "Personas", "Notas", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-body font-bold text-foreground uppercase tracking-wider text-xs">
                      {h}
                    </th>
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
                      <td className="px-4 py-3 font-body text-muted-foreground">
                        <div>{r.email}</div>
                        <div>{r.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-body text-foreground text-center">{r.guests}</td>
                      <td className="px-4 py-3 font-body text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-sm text-xs font-bold font-body ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status !== "confirmed" && (
                            <button
                              onClick={() => confirmReservation(r.id)}
                              className="px-2 py-1 text-xs font-body font-bold bg-secondary/20 text-secondary rounded-sm hover:bg-secondary/30 transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {r.status !== "cancelled" && (
                            <button
                              onClick={() => updateStatus(r.id, "cancelled")}
                              className="px-2 py-1 text-xs font-body font-bold bg-destructive/20 text-destructive rounded-sm hover:bg-destructive/30 transition-colors"
                            >
                              Cancelar
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
        )}
      </div>
    </div>
  );
};

export default Admin;
