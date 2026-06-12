import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

let globalConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

/**
 * Imperative confirm helper — usable outside React hooks.
 * Falls back to window.confirm if the provider is not mounted.
 */
export const confirmAction = (options: ConfirmOptions | string): Promise<boolean> => {
  const opts = typeof options === "string" ? { description: options } : options;
  if (globalConfirm) return globalConfirm(opts);
  // eslint-disable-next-line no-alert
  return Promise.resolve(window.confirm(opts.description ?? opts.title ?? "Bestätigen?"));
};

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((options) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  useEffect(() => {
    globalConfirm = confirm;
    return () => { if (globalConfirm === confirm) globalConfirm = null; };
  }, [confirm]);

  const handle = (value: boolean) => {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(v) => !v && handle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title ?? "Aktion bestätigen"}</AlertDialogTitle>
            {opts.description && (
              <AlertDialogDescription>{opts.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handle(false)}>
              {opts.cancelLabel ?? "Abbrechen"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handle(true)}
              className={opts.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            >
              {opts.confirmLabel ?? "Bestätigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
};
