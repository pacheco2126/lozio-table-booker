import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { OrderFlowProvider } from "@/contexts/OrderFlowContext";
import OrderTypeDialog from "@/components/OrderTypeDialog";
import CartDrawer from "@/components/CartDrawer";
import CartFloatingButton from "@/components/CartFloatingButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallBanner from "@/components/InstallBanner";
import SamsungBrowserBanner from "@/components/SamsungBrowserBanner";
import UpdateBanner from "@/components/UpdateBanner";
import AdminFAB from "@/components/AdminFAB";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import IncomingOrderManager from "@/components/IncomingOrderManager";
import { initStorePauses } from "@/lib/storePause";

import AdminInventoryPage from "./pages/AdminInventoryPage.tsx";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import Locales from "./pages/Locales.tsx";
import LocationDetail from "./pages/LocationDetail.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MyReservations from "./pages/MyReservations.tsx";
import NotFound from "./pages/NotFound.tsx";
import ReviewPage from "./pages/ReviewPage.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Empleo from "./pages/Empleo.tsx";
import EmpleoDetail from "./pages/EmpleoDetail.tsx";
import FAQs from "./pages/FAQs.tsx";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const queryClient = new QueryClient();

const AdminNotificationListener = () => {
  useAdminNotifications();
  return null;
};

const StorePauseSync = () => {
  useEffect(() => initStorePauses(), []);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};


const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <OrderFlowProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <AdminNotificationListener />
          <BrowserRouter>
            <ScrollToTop />
            <InstallBanner />
            <SamsungBrowserBanner />
            <UpdateBanner />
            <CartDrawer />
            <CartFloatingButton />
            <MobileBottomNav />
            <AdminFAB />
            <IncomingOrderManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/mis-reservas" element={<MyReservations />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/pedido" element={<Elements stripe={stripePromise}><Checkout /></Elements>} />
              <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
              <Route path="/locales" element={<Locales />} />
              <Route path="/locales/:slug" element={<LocationDetail />} />
              <Route path="/resenas" element={<ReviewPage />} />
              <Route path="/admin/pedidos/:store" element={<AdminOrders />} />
              <Route path="/mis-pedidos" element={<MyOrders />} />
              <Route path="/admin/inventario" element={<AdminInventoryPage />} />
              <Route path="/empleo" element={<Empleo />} />
              <Route path="/empleo/:id" element={<EmpleoDetail />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <OrderTypeDialog />
          </BrowserRouter>
        </TooltipProvider>
        </OrderFlowProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
