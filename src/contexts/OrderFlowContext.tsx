import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type OrderType = "pickup" | "delivery";
export type OrderIntent = "order" | "reservation" | null;

export interface OrderFlowAddress {
  address: string;       // street + number
  streetNumber: string;
  city: string;
  postalCode: string;
}

export interface OrderFlowState {
  orderType: OrderType | null;
  storeSlug: string | null;          // assigned store for pickup OR delivery
  address: OrderFlowAddress | null;  // only for delivery
  scheduledFor: string | null;       // ISO datetime; null = ASAP
  intent: OrderIntent;               // user's current visit intent
}

interface OrderFlowContextType extends OrderFlowState {
  setFlow: (state: Partial<OrderFlowState>) => void;
  setIntent: (intent: OrderIntent) => void;
  clearFlow: () => void;
  isDialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const STORAGE_KEY = "lozio_order_flow";

const defaultState: OrderFlowState = {
  orderType: null,
  storeSlug: null,
  address: null,
  scheduledFor: null,
  intent: null,
};

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<OrderFlowState>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
    } catch {/* ignore */}
    return defaultState;
  });
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state]);

  const setFlow = (patch: Partial<OrderFlowState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const clearFlow = () => {
    setState(defaultState);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {/* ignore */}
  };

  return (
    <OrderFlowContext.Provider
      value={{
        ...state,
        setFlow,
        clearFlow,
        isDialogOpen,
        openDialog: () => setDialogOpen(true),
        closeDialog: () => setDialogOpen(false),
      }}
    >
      {children}
    </OrderFlowContext.Provider>
  );
};

export const useOrderFlow = () => {
  const ctx = useContext(OrderFlowContext);
  if (!ctx) throw new Error("useOrderFlow must be used within OrderFlowProvider");
  return ctx;
};
