import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'admin' | 'director' | 'service' | 'kitchen' | 'conference' | 'user';

export const ADMIN_ACCESS_ROLES: AdminRole[] = ['admin', 'director', 'service', 'kitchen', 'conference'];
export const FULL_ADMIN_ROLES: AdminRole[] = ['admin', 'director'];

type LogPayload = {
  action: string;
  entity?: string;
  entityId?: string | null;
  diff?: Record<string, unknown>;
};

const normalizeRole = (role: unknown): AdminRole => {
  const value = String(role ?? 'user').toLowerCase();
  if (value === 'director' || value === 'service' || value === 'kitchen' || value === 'conference' || value === 'admin') {
    return value;
  }
  return 'user';
};

export const adminSecurity = {
  async getRoles(): Promise<AdminRole[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) return [];
      return Array.from(new Set((data ?? []).map((row: { role: unknown }) => normalizeRole(row.role))));
    } catch {
      return [];
    }
  },
  async hasAnyRole(allowedRoles: AdminRole[]): Promise<boolean> {
    const roles = await this.getRoles();
    return roles.some((role) => allowedRoles.includes(role));
  },
  async hasAdminAccess(): Promise<boolean> {
    return this.hasAnyRole(ADMIN_ACCESS_ROLES);
  },
  async isAdmin(): Promise<boolean> {
    return this.hasAnyRole(FULL_ADMIN_ROLES);
  },
  async isSuperAdmin(): Promise<boolean> {
    return this.isAdmin();
  },
  /**
   * Persist an admin action to admin_audit_log via security-definer RPC.
   * Silently no-ops when the caller is not an admin.
   */
  async logAction(payload: LogPayload): Promise<void> {
    try {
      // Cast to any: log_admin_action exists in DB but may not be in generated types yet
      // until the next types regeneration cycle.
      await (supabase.rpc as any)('log_admin_action', {
        p_action: payload.action,
        p_entity: payload.entity ?? null,
        p_entity_id: payload.entityId ?? null,
        p_diff: payload.diff ?? {},
      });
    } catch (e) {
      // Audit logging must never break user flows
      // eslint-disable-next-line no-console
      console.warn('[adminSecurity] logAction failed:', e);
    }
  },
  async requireAdmin(): Promise<void> {
    if (!(await this.isAdmin())) throw new Error('Admin access required');
  },
  async requireSuperAdmin(): Promise<void> {
    return this.requireAdmin();
  },
  async createTemporaryAdmin(): Promise<boolean> { return false; },
};
