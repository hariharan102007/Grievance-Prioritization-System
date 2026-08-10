'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChartBar as BarChart3, Loader as Loader2, TrendingUp, TrendingDown, Users, CircleCheck as CheckCircle2, Clock, TriangleAlert as AlertTriangle, Building2, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  supabase,
  type Complaint,
} from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import { cn } from '@/lib/utils';

const PRIORITY_CHART_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6',
};

const STATUS_CHART_COLORS: Record<string, string> = {
  Registered: '#64748b',
  Assigned: '#6366f1',
  'In Progress': '#f59e0b',
  Resolved: '#10b981',
};

export default function OfficerManagementPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        toast.error('Failed to load data');
      } else {
        setComplaints((data || []) as Complaint[]);
      }
      setLoading(false);
    })();
  }, []);

  const metrics = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const critical = complaints.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved').length;
    const duplicates = complaints.filter((c) => c.duplicate_of).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const resolvedComplaints = complaints.filter((c) => c.resolved_at);
    const avgResolutionHours =
      resolvedComplaints.length > 0
        ? Math.round(
            resolvedComplaints.reduce((sum, c) => {
              const hours =
                (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) /
                3600000;
              return sum + hours;
            }, 0) / resolvedComplaints.length
          )
        : 0;
    return { total, resolved, critical, duplicates, resolutionRate, avgResolutionHours };
  }, [complaints]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    complaints.forEach((c) => {
      if (c.category) map.set(c.category, (map.get(c.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [complaints]);

  const byPriority = useMemo(() => {
    const map = new Map<string, number>();
    complaints.forEach((c) => {
      map.set(c.priority, (map.get(c.priority) || 0) + 1);
    });
    return ['Critical', 'High', 'Medium', 'Low']
      .map((name) => ({ name, value: map.get(name) || 0, fill: PRIORITY_CHART_COLORS[name] }))
      .filter((d) => d.value > 0);
  }, [complaints]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    complaints.forEach((c) => {
      map.set(c.status, (map.get(c.status) || 0) + 1);
    });
    return ['Registered', 'Assigned', 'In Progress', 'Resolved']
      .map((name) => ({ name, value: map.get(name) || 0 }))
      .filter((d) => d.value > 0);
  }, [complaints]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, { total: number; resolved: number }>();
    complaints.forEach((c) => {
      if (!c.department) return;
      const entry = map.get(c.department) || { total: 0, resolved: 0 };
      entry.total += 1;
      if (c.status === 'Resolved') entry.resolved += 1;
      map.set(c.department, entry);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name: name.replace(' Department', ''),
        total: v.total,
        resolved: v.resolved,
        rate: v.total > 0 ? Math.round((v.resolved / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [complaints]);

  const trend = useMemo(() => {
    const days: { date: string; filed: number; resolved: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, filed: 0, resolved: 0 });
    }
    complaints.forEach((c) => {
      const fkey = new Date(c.created_at).toISOString().slice(0, 10);
      const fday = days.find((d) => d.date === fkey);
      if (fday) fday.filed += 1;
      if (c.resolved_at) {
        const rkey = new Date(c.resolved_at).toISOString().slice(0, 10);
        const rday = days.find((d) => d.date === rkey);
        if (rday) rday.resolved += 1;
      }
    });
    return days.map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [complaints]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6 text-sky-500" />
          Officer Management & Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Officer registration, verification, AI-driven assignment, and complaint prioritization.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="animate-slide-up stagger-1">
        <KpiCard
          icon={Users}
          label="Total Complaints"
          value={metrics.total}
          trend={metrics.total > 0 ? '+active' : undefined}
        />
        </div>
        <div className="animate-slide-up stagger-2">
        <KpiCard
          icon={CheckCircle2}
          label="Resolution Rate"
          value={`${metrics.resolutionRate}%`}
          sub={`${metrics.resolved} resolved`}
          color="emerald"
        />
        </div>
        <div className="animate-slide-up stagger-3">
        <KpiCard
          icon={Clock}
          label="Avg. Resolution"
          value={metrics.avgResolutionHours > 0 ? `${metrics.avgResolutionHours}h` : '-'}
          sub="time to resolve"
          color="amber"
        />
        </div>
        <div className="animate-slide-up stagger-4">
        <KpiCard
          icon={AlertTriangle}
          label="Critical Open"
          value={metrics.critical}
          sub="needs attention"
          color="red"
        />
        </div>
      </div>

      {/* Trend chart */}
      <Card className="mb-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-sky-500" />
            Complaints Trend (14 days)
          </CardTitle>
          <CardDescription>Daily filed vs. resolved complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="filedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="filed"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#filedGrad)"
                  name="Filed"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#resolvedGrad)"
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Category bar chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Complaints by Category</CardTitle>
            <CardDescription>Distribution across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={90}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority pie */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Priority Distribution</CardTitle>
            <CardDescription>AI-assigned priority breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byPriority}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {byPriority.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department performance table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-sky-500" />
            Department Performance
          </CardTitle>
          <CardDescription>Workload and resolution rate by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 pr-4 font-medium">Resolved</th>
                  <th className="pb-3 pr-4 font-medium">Resolution Rate</th>
                  <th className="pb-3 font-medium">Workload</th>
                </tr>
              </thead>
              <tbody>
                {byDepartment.map((d) => (
                  <tr key={d.name} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4 font-medium">{d.name}</td>
                    <td className="py-3 pr-4">{d.total}</td>
                    <td className="py-3 pr-4">{d.resolved}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                          d.rate >= 50
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : d.rate > 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {d.rate}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.min((d.total / Math.max(...byDepartment.map((x) => x.total), 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'sky',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  trend?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'red';
}) {
  const colors = {
    sky: 'text-sky-500 bg-sky-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-red-500 bg-red-500/10',
  };
  return (
    <Card className="animate-slide-up border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3 text-3xl font-bold leading-none">{value}</div>
        <div className="mt-1.5 text-xs text-muted-foreground">{sub || label}</div>
      </CardContent>
    </Card>
  );
}
