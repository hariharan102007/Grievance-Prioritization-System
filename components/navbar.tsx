'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Users, Brain, Menu, LogOut, Building2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NavbarProps = {
  user?: { name: string; email: string; role?: 'citizen' | 'officer' } | null;
  onLogout?: () => void;
};

const CITIZEN_NAV_ITEMS = [
  { href: '/', label: 'Citizen Portal', icon: Users, accent: 'text-sky-500', activeBg: 'bg-sky-500/10' },
];

const OFFICER_NAV_ITEMS = [
  { href: '/officer', label: 'Officer Intelligence', icon: Brain, accent: 'text-violet-500', activeBg: 'bg-violet-500/10' },
  { href: '/officers', label: 'Officer Directory', icon: ShieldCheck, accent: 'text-emerald-500', activeBg: 'bg-emerald-500/10' },
];

export function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeRole = user?.role ?? 'guest';
  const navItems = activeRole === 'officer' ? OFFICER_NAV_ITEMS : activeRole === 'citizen' ? CITIZEN_NAV_ITEMS : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 shadow-lg shadow-sky-500/25 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">AI Grievance System</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Citizen · Officer · AI Command
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? `${item.activeBg} ${item.accent}`
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <span className={cn('ml-0.5 h-1.5 w-1.5 rounded-full', item.accent.replace('text-', 'bg-'))} />
                )}
              </Link>
            );
          })}
          {!user && (
            <>
              <Link href="/login?role=citizen" className="rounded-lg px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-500/10">
                Citizen Login
              </Link>
              <Link href="/officer/login" className="rounded-lg px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-500/10">
                Officer Login
              </Link>
            </>
          )}
          {user && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/60 bg-background px-4 py-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? `${item.activeBg} ${item.accent}` : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
