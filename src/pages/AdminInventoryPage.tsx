import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInventoryAccess } from "@/hooks/useInventoryAccess";
import Navbar from "@/components/Navbar";
import AdminInventory from "@/components/AdminInventory";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

const AdminInventoryPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stores, loading: accessLoading } = useInventoryAccess();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!accessLoading && stores.length === 0) navigate("/");
  }, [accessLoading, stores, navigate]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar forceSolid />
      <div className="pt-24 md:pt-28 pb-16 px-3 md:px-4 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="font-body text-xs mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver a admin
        </Button>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
          Inventario
        </h1>
        <AdminInventory />
      </div>
    </div>
  );
};

export default AdminInventoryPage;
