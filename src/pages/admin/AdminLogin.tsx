import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Small helper to avoid auth limbo states
const cleanupAuthState = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setResetMode(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        toast.success("Erfolgreich angemeldet");
        // After login, redirect to the main Admin Dashboard overview
        window.location.href = '/admin';
      }
    } catch (err: any) {
      toast.error("Anmeldung fehlgeschlagen", { description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Bitte E-Mail-Adresse eintragen");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;
      toast.success("E-Mail zum Zurücksetzen wurde verschickt", {
        description: "Bitte Postfach prüfen und danach ein neues Passwort vergeben.",
      });
      setResetMode(false);
    } catch (err: any) {
      toast.error("Reset-E-Mail konnte nicht versendet werden", { description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveredPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Das neue Passwort braucht mindestens 8 Zeichen");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Passwort aktualisiert");
      window.location.href = "/admin";
    } catch (err: any) {
      toast.error("Passwort konnte nicht geändert werden", { description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-[70vh] grid place-items-center p-4">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Admin Anmeldung</h1>
          <p className="text-sm text-muted-foreground">Nur freigeschaltete Admins erhalten Zugriff.</p>
        </header>

        {recoveryMode ? (
          <form onSubmit={handleRecoveredPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">Neues Passwort speichern</Button>
          </form>
        ) : resetMode ? (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin-E-Mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={loading}>Reset-Link senden</Button>
              <Button type="button" variant="ghost" onClick={() => setResetMode(false)} disabled={loading}>Zur Anmeldung</Button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={loading}>Anmelden</Button>
            <Button type="button" variant="ghost" onClick={() => setResetMode(true)} disabled={loading}>
              Passwort vergessen?
            </Button>
          </div>
        </form>
        )}

        <aside className="mt-4 text-xs text-muted-foreground">
          <p>{resetMode ? "Die E-Mail muss zu einem freigeschalteten Admin gehören." : "Bitte mit Admin-Zugangsdaten anmelden."}</p>
        </aside>
      </section>
    </main>
  );
}
