/**
 * AdminErrorBoundary
 * Fängt JavaScript-Fehler in Admin-Routen ab und zeigt eine freundliche
 * Fallback-UI mit Aktionen (Neu laden / zurück), damit ein einzelner Bug
 * nicht das gesamte Backend unbedienbar macht.
 */
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[AdminErrorBoundary]", error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-lg w-full bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-2">
            Es ist ein Fehler aufgetreten
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Diese Admin-Sektion konnte nicht geladen werden. Sie können die
            Seite neu laden oder zur Übersicht zurückkehren – Ihre Daten sind
            sicher.
          </p>
          {this.state.error?.message && (
            <pre className="text-left text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 mb-6 max-h-32 overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--apple))] text-white hover:bg-[hsl(var(--apple)/0.9)] inline-flex items-center gap-2 text-sm font-medium"
            >
              <RotateCw className="w-4 h-4" /> Neu laden
            </button>
            <button
              onClick={() => {
                this.handleReset();
                window.location.assign("/admin");
              }}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/40 inline-flex items-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" /> Zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminErrorBoundary;
