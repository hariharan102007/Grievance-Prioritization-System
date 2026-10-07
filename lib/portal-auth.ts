export type PortalRole = 'citizen' | 'officer';

export type PortalSession = {
  name: string;
  email: string;
  role: PortalRole;
  employeeId?: string;
};

export const PORTAL_STORAGE_KEY = 'grievance_user_session';

export function readPortalSession(): PortalSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(PORTAL_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<PortalSession> & { role?: string };
    if (!parsed || typeof parsed !== 'object') return null;

    const role = parsed.role === 'officer' ? 'officer' : 'citizen';
    const name = typeof parsed.name === 'string' ? parsed.name : 'Citizen User';
    const email = typeof parsed.email === 'string' ? parsed.email : '';
    const employeeId = typeof parsed.employeeId === 'string' ? parsed.employeeId : undefined;

    if (!email) return null;

    return { name, email, role, employeeId };
  } catch {
    localStorage.removeItem(PORTAL_STORAGE_KEY);
    return null;
  }
}

export function writePortalSession(session: PortalSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(session));
}

export function clearPortalSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PORTAL_STORAGE_KEY);
}

export function getPortalRedirect(role: PortalRole) {
  return role === 'officer' ? '/officer' : '/';
}
