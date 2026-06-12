import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cached: boolean | null = null;
const subs = new Set<(v: boolean) => void>();

async function check() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { cached = false; subs.forEach(cb => cb(false)); return; }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "director"] as any)
      .maybeSingle();
    cached = !!data;
  } catch {
    cached = false;
  }
  subs.forEach(cb => cb(!!cached));
}

/** Lightweight, cached admin-role check. Re-checks on auth state change. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(cached ?? false);
  useEffect(() => {
    const cb = (v: boolean) => setIsAdmin(v);
    subs.add(cb);
    if (cached === null) {
      check();
    } else {
      setIsAdmin(cached);
    }
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      cached = null;
      check();
    });
    return () => {
      subs.delete(cb);
      sub.subscription.unsubscribe();
    };
  }, []);
  return isAdmin;
}
