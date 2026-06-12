/**
 * useAdminStore — Globaler Client-State für den Admin-Bereich
 *
 * Leichtgewichtiger Zustand (kein Redux-Overhead) mit:
 *   - Sidebar collapsed state (persistiert in localStorage)
 *   - Command Palette open/close
 *   - Global Toast / Notification Queue
 *   - Optimistic UI: pending operations queue
 *   - Active Drawer tracker
 *
 * Pattern: React Context + useReducer (Zero external dependencies)
 * Kann einfach durch Zustand ersetzt werden, wenn mehr Performance nötig ist.
 */

import {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    ReactNode,
} from "react";

/* ─────────────────────────────────────────────
   TOAST TYPES
───────────────────────────────────────────── */
export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
    durationMs?: number;
}

/* ─────────────────────────────────────────────
   OPTIMISTIC OPERATION
───────────────────────────────────────────── */
export interface PendingOp {
    id: string;
    description: string;
    timestamp: number;
}

/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
interface AdminState {
    sidebarCollapsed: boolean;
    cmdPaletteOpen: boolean;
    toasts: Toast[];
    pendingOps: PendingOp[];
    activeDrawerId: string | null;
}

const SIDEBAR_KEY = "admin:sidebarCollapsed";

function getInitialState(): AdminState {
    let collapsed = false;
    try {
          collapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch (_) {/* ignore */}

  return {
        sidebarCollapsed: collapsed,
        cmdPaletteOpen: false,
        toasts: [],
        pendingOps: [],
        activeDrawerId: null,
  };
}

/* ─────────────────────────────────────────────
   ACTIONS
───────────────────────────────────────────── */
type AdminAction =
    | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_COLLAPSED"; collapsed: boolean }
  | { type: "OPEN_CMD_PALETTE" }
  | { type: "CLOSE_CMD_PALETTE" }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "ADD_PENDING_OP"; op: PendingOp }
  | { type: "REMOVE_PENDING_OP"; id: string }
  | { type: "SET_ACTIVE_DRAWER"; drawerId: string | null };

/* ─────────────────────────────────────────────
   REDUCER
───────────────────────────────────────────── */
function adminReducer(state: AdminState, action: AdminAction): AdminState {
    switch (action.type) {
      case "TOGGLE_SIDEBAR":
              return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

      case "SET_SIDEBAR_COLLAPSED":
              return { ...state, sidebarCollapsed: action.collapsed };

      case "OPEN_CMD_PALETTE":
              return { ...state, cmdPaletteOpen: true };

      case "CLOSE_CMD_PALETTE":
              return { ...state, cmdPaletteOpen: false };

      case "ADD_TOAST":
              return { ...state, toasts: [...state.toasts, action.toast] };

      case "REMOVE_TOAST":
              return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

      case "ADD_PENDING_OP":
              return { ...state, pendingOps: [...state.pendingOps, action.op] };

      case "REMOVE_PENDING_OP":
              return { ...state, pendingOps: state.pendingOps.filter((o) => o.id !== action.id) };

      case "SET_ACTIVE_DRAWER":
              return { ...state, activeDrawerId: action.drawerId };

      default:
              return state;
    }
}

/* ─────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────── */
interface AdminContextValue {
    state: AdminState;
    // Sidebar
  toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    // Command Palette
  openCmdPalette: () => void;
    closeCmdPalette: () => void;
    // Toasts
  addToast: (message: string, variant?: ToastVariant, durationMs?: number) => string;
    removeToast: (id: string) => void;
    // Optimistic UI
  addPendingOp: (description: string) => string;
    removePendingOp: (id: string) => void;
    // Drawers
  openDrawer: (drawerId: string) => void;
    closeDrawer: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

/* ─────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────── */
export function AdminStoreProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(adminReducer, undefined, getInitialState);

  // Persist sidebar state
  useEffect(() => {
        try {
                localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed));
        } catch (_) {/* ignore */}
  }, [state.sidebarCollapsed]);

  const toggleSidebar = useCallback(() => dispatch({ type: "TOGGLE_SIDEBAR" }), []);
    const setSidebarCollapsed = useCallback((collapsed: boolean) =>
          dispatch({ type: "SET_SIDEBAR_COLLAPSED", collapsed }), []);

  const openCmdPalette = useCallback(() => dispatch({ type: "OPEN_CMD_PALETTE" }), []);
    const closeCmdPalette = useCallback(() => dispatch({ type: "CLOSE_CMD_PALETTE" }), []);

  const addToast = useCallback((
        message: string,
        variant: ToastVariant = "info",
        durationMs = 4000
      ): string => {
            const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const toast: Toast = { id, message, variant, durationMs };
            dispatch({ type: "ADD_TOAST", toast });
            // Auto-dismiss
                                   if (durationMs > 0) {
                                           setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), durationMs);
                                   }
            return id;
      }, []);

  const removeToast = useCallback((id: string) =>
        dispatch({ type: "REMOVE_TOAST", id }), []);

  const addPendingOp = useCallback((description: string): string => {
        const id = `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        dispatch({ type: "ADD_PENDING_OP", op: { id, description, timestamp: Date.now() } });
        return id;
  }, []);

  const removePendingOp = useCallback((id: string) =>
        dispatch({ type: "REMOVE_PENDING_OP", id }), []);

  const openDrawer = useCallback((drawerId: string) =>
        dispatch({ type: "SET_ACTIVE_DRAWER", drawerId }), []);

  const closeDrawer = useCallback(() =>
        dispatch({ type: "SET_ACTIVE_DRAWER", drawerId: null }), []);

  return (
        <AdminContext.Provider value={{
          state,
          toggleSidebar,
          setSidebarCollapsed,
          openCmdPalette,
          closeCmdPalette,
          addToast,
          removeToast,
          addPendingOp,
          removePendingOp,
          openDrawer,
          closeDrawer,
  }}>
{children}
</AdminContext.Provider>
    );
}

/* ─────────────────────────────────────────────
   HOOK
───────────────────────────────────────────── */
export function useAdminStore(): AdminContextValue {
    const ctx = useContext(AdminContext);
    if (!ctx) {
          throw new Error("useAdminStore must be used within AdminStoreProvider");
    }
    return ctx;
}

/* ─────────────────────────────────────────────
   OPTIMISTIC UI HELPER HOOK
   Usage:
     const { run } = useOptimisticAction();
     await run("Speichere Raum...", async () => {
       await saveRoom(data);
     }, {
       onSuccess: () => addToast("Gespeichert!", "success"),
       onError: (err) => addToast(err.message, "error"),
     });
───────────────────────────────────────────── */
interface OptimisticOptions<T> {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    rollback?: () => void;
}

export function useOptimisticAction() {
    const { addPendingOp, removePendingOp } = useAdminStore();

  const run = useCallback(async <T,>(
        description: string,
        action: () => Promise<T>,
        options: OptimisticOptions<T> = {}
      ): Promise<T | undefined> => {
            const opId = addPendingOp(description);
            try {
                    const result = await action();
                    options.onSuccess?.(result);
                    return result;
            } catch (err) {
                    options.rollback?.();
                    options.onError?.(err instanceof Error ? err : new Error(String(err)));
                    return undefined;
            } finally {
                    removePendingOp(opId);
            }
      }, [addPendingOp, removePendingOp]);

  return { run };
}
