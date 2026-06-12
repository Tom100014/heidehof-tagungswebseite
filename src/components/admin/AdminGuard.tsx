import React, { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminSecurity, ADMIN_ACCESS_ROLES, type AdminRole } from "@/utils/admin-security";
import AdminLogin from "@/pages/admin/AdminLogin";

interface AdminGuardProps {
  children: ReactNode;
  allowedRoles?: AdminRole[];
}

/**
 * Session-scoped cache so navigating between admin routes doesn't trigger
 * a full re-check (network round-trip + UI flash) on every mount.
 * Invalidated on SIGNED_IN / SIGNED_OUT / USER_UPDATED.
 */
let cachedRoles: AdminRole[] | null = null;
let inflight: Promise<boolean> | null = null;

const resolveAdmin = async (allowedRoles: AdminRole[]): Promise<boolean> => {
  if (cachedRoles !== null) return cachedRoles.some((role) => allowedRoles.includes(role));
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        cachedRoles = [];
        return false;
      }
      const roles = await adminSecurity.getRoles();
      cachedRoles = roles;
      return roles.some((role) => allowedRoles.includes(role));
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

const invalidateAdminCache = () => {
  cachedRoles = null;
  inflight = null;
};

const AdminGuard: React.FC<AdminGuardProps> = ({ children, allowedRoles = ADMIN_ACCESS_ROLES }) => {
  const [loading, setLoading] = useState(cachedRoles === null);
  const [isAdmin, setIsAdmin] = useState<boolean>(cachedRoles?.some((role) => allowedRoles.includes(role)) ?? false);

  useEffect(() => {
    let mounted = true;

    const check = async (force = false) => {
      if (force) invalidateAdminCache();
      const result = await resolveAdmin(allowedRoles);
      if (mounted) {
        setIsAdmin(result);
        setLoading(false);
      }
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      check(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
        Lade Admin-Bereich...
      </div>
    );
  }

  if (!isAdmin) {
    if ((cachedRoles?.length ?? 0) > 0) {
      return (
        <div className="min-h-[60vh] grid place-items-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">Kein Zugriff auf diesen Bereich</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ihr Zugang ist auf einen Fachbereich beschränkt. Bitte öffnen Sie das passende Dashboard oder melden Sie sich mit einem Direktor-/Admin-Zugang an.
            </p>
          </div>
        </div>
      );
    }
    return <AdminLogin />;
  }

  return <>{children}</>;
};

export default AdminGuard;
