'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  DEPARTMENTS_DATA,
  DepartmentInfo,
  getIconComponent,
} from '@/lib/departments-data';
import { supabase, type Complaint } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DepartmentsIndexPage() {
  const [search, setSearch] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('complaints')
        .select('id, department, priority, status');
      if (data) setComplaints(data as Complaint[]);
      setLoading(false);
    })();
  }, []);

  const departmentStats = useMemo(() => {
    const statsMap: Record<
      string,
      { total: number; active: number; resolved: number; critical: number }
    > = {};

    DEPARTMENTS_DATA.forEach((d) => {
      statsMap[d.name] = { total: 0, active: 0, resolved: 0, critical: 0 };
    });

    complaints.forEach((c) => {
      const deptName = c.department || 'General Administration';
      if (!statsMap[deptName]) {
        statsMap[deptName] = { total: 0, active: 0, resolved: 0, critical: 0 };
      }
      statsMap[deptName].total += 1;
      if (c.status === 'Resolved') {
        statsMap[deptName].resolved += 1;
      } else {
        statsMap[deptName].active += 1;
        if (c.priority === 'Critical') {
          statsMap[deptName].critical += 1;
        }
      }
    });

    return statsMap;
  }, [complaints]);

  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return DEPARTMENTS_DATA;
    const q = search.toLowerCase().trim();
    return DEPARTMENTS_DATA.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.services.some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-mesh pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-cyan-500/5 via-sky-500/5 to-transparent py-14">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              <Building2 className="h-3.5 w-3.5" />
              Government Departments Directory
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Dedicated{' '}
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                Department Portals
              </span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Explore specialized civic departments, access separate department websites, track real-time resolution SLAs, meet assigned officers, or file direct complaints.
            </p>

            {/* Search Input */}
            <div className="mt-8 mx-auto max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search department, e.g. Water, Electricity, Road Repair..."
                className="h-12 pl-11 pr-4 rounded-xl border-border/80 bg-background/90 text-sm shadow-md focus-visible:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Department Portals */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              All Public Departments ({filteredDepartments.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any department card to visit its separate department site
            </p>
          </div>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground">
            <Building2 className="mx-auto h-10 w-10 opacity-40 mb-3" />
            <p className="font-semibold">No department matches "{search}"</p>
            <p className="text-xs mt-1">Try searching for Water, Power, Sanitation, Police, or Road.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => {
              const Icon = getIconComponent(dept.iconName);
              const stats = departmentStats[dept.name] || {
                total: 0,
                active: 0,
                resolved: 0,
                critical: 0,
              };

              return (
                <Card
                  key={dept.slug}
                  className={cn(
                    'group relative overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-500/40 flex flex-col justify-between'
                  )}
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-5">
                    {/* Top Bar */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition-transform group-hover:scale-105',
                            dept.bg,
                            dept.border
                          )}
                        >
                          <Icon className={cn('h-7 w-7', dept.color)} />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Target SLA: {dept.targetSlaHours}h
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {dept.name}
                      </h3>
                      <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mt-0.5">
                        Category: {dept.category}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {dept.tagline}
                      </p>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 border border-border/40 text-center">
                      <div>
                        <div className="text-base font-bold text-foreground">
                          {loading ? '...' : stats.active}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Active
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {loading ? '...' : stats.resolved}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Resolved
                        </div>
                      </div>
                      <div>
                        <div
                          className={cn(
                            'text-base font-bold',
                            stats.critical > 0 ? 'text-red-500' : 'text-muted-foreground'
                          )}
                        >
                          {loading ? '...' : stats.critical}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Critical
                        </div>
                      </div>
                    </div>

                    {/* Contact & Lead info */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{dept.helpline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        <span className="truncate">Lead: {dept.leadOfficer.name}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <Link href={`/departments/${dept.slug}`} className="flex-1">
                        <Button
                          variant="default"
                          className={cn(
                            'w-full gap-2 text-xs font-semibold shadow-md bg-gradient-to-r hover:opacity-90',
                            dept.gradient
                          )}
                        >
                          Visit Department Site
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
