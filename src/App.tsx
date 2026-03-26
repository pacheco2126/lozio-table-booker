import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartFloatingButton from "@/components/CartFloatingButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallBanner from "@/components/InstallBanner";
import UpdateBanner from "@/components/UpdateBanner";
import AdminFAB from "@/components/AdminFAB";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import Checkout from "./pages/Checkout.tsx";
import Locales from "./pages/Locales.tsx";
import LocationDetail from "./pages/LocationDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <InstallBanner />
            <UpdateBanner />
            <CartDrawer />
            <CartFloatingButton />
            <MobileBottomNav />
            <AdminFAB />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/pedido" element={<Checkout />} />
              <Route path="/locales" element={<Locales />} />
              <Route path="/locales/:slug" element={<LocationDetail />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
