'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { clearPortalSession, readPortalSession, writePortalSession, type PortalSession } from '@/lib/portal-auth';

type UserSession = Pick<PortalSession, 'name' | 'email' | 'role'>;

export function Shell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = readPortalSession();
    if (saved) {
      setUser({ name: saved.name, email: saved.email, role: saved.role });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    writePortalSession({ name: user.name, email: user.email, role: user.role });
  }, [user]);

  const handleLogout = () => {
    clearPortalSession();
    setUser(null);
    toast.success('You have been signed out.');
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Toaster />
    </>
  );
}
