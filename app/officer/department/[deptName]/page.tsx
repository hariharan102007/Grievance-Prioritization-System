'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  ListFilter as Filter,
  Loader as Loader2,
  Search,
  CircleCheck as CheckCircle2,
  Clock,
  TriangleAlert as AlertTriangle,
  TrendingUp,
  Inbox,
  MessageSquare,
  Zap,
  Droplet,
  HardHat,
  Trash2,
  HeartPulse,
  Shield,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import {
  supabase,
  type Complaint,
  PRIORITY_ORDER,
  STATUS_FLOW,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const DEPT_THEME: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
    desc: string;
  }
> = {
  'Electricity Department': {
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    desc: 'Power grids, wiring, streetlights',
  },
  'Water Department': {
    icon: Droplet,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
    desc: 'Water supply, pipeline leaks',
  },
  'Public Works Department': {
    icon: HardHat,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-500/30',
    desc: 'Roads, potholes, public facilities',
  },
  'Sanitation Department': {
    icon: Trash2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    desc: 'Garbage, sewage, and cleanliness',
  },
  'Health Department': {
    icon: HeartPulse,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    desc: 'Hospitals, public hygiene, hazards',
  },
  'Police Department': {
    icon: Shield,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    desc: 'Safety, local crimes, enforcement',
  },
};

export default function DepartmentPage({
  params,
}: {
  params: { deptName: string };
}) {
  const deptName = decodeURIComponent(params.deptName);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const theme = useMemo(() => {
    return DEPT_THEME[deptName] || {
      icon: HelpCircle,
      color: 'text-slate-500',
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      border: 'border-slate-500/30',
      desc: 'General public concerns',
    };
  }, [deptName]);

  const DepartmentIcon = theme.icon;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('department', deptName)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load complaints');
    } else {
      setComplaints((data || []) as Complaint[]);
    }
    setLoading(false);
  }, [deptName]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return complaints
      .filter((c) => !c.duplicate_of) // duplicates are merged; hide from queue
      .filter((c) => (statusFilter === 'all' ? true : c.status === statusFilter))
      .filter((c) =>
        search.trim()
          ? c.description.toLowerCase().includes(search.toLowerCase()) ||
            c.ticket_id.toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [complaints, statusFilter, search]);

  const stats = useMemo(() => {
    const active = complaints.filter((c) => !c.duplicate_of && c.status !== 'Resolved');
    return {
      total: active.length,
      critical: active.filter((c) => c.priority === 'Critical').length,
      high: active.filter((c) => c.priority === 'High').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
    };
  }, [complaints]);

  function openUpdate(c: Complaint) {
    setSelected(c);
    const idx = STATUS_FLOW.indexOf(c.status as (typeof STATUS_FLOW)[number]);
    setNewStatus(STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)]);
    setRemarks(c.officer_remarks || '');
  }

  async function handleSave() {
    if (!selected || !newStatus) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        officer_remarks: remarks.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'Resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', selected.id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        complaint_id: selected.id,
        action: `Status updated to ${newStatus}`,
        from_status: selected.status,
        to_status: newStatus,
        remarks: remarks.trim() || null,
      });

      toast.success(`${selected.ticket_id} → ${newStatus}`);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error('Failed to update', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back & Breadcrumbs */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/officer">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Officer Intelligence
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', theme.bg, theme.border)}>
            <DepartmentIcon className={cn('h-8 w-8', theme.color)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{deptName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{theme.desc}</p>
          </div>
        </div>
        <Link href={`/departments/${encodeURIComponent(deptName)}`}>
          <Button variant="outline" size="sm" className="gap-2 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10">
            View Public Department Portal Site
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Inbox} label="Active Complaints" value={stats.total} color="sky" />
        <StatCard icon={AlertTriangle} label="Critical" value={stats.critical} color="red" />
        <StatCard icon={Clock} label="High Priority" value={stats.high} color="orange" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="emerald" />
      </div>

      {/* Filters */}
      <Card className="mb-6 border-border/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID or description..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_FLOW.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Queue */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" />
            <p className="text-lg font-semibold">All caught up</p>
            <p className="text-sm text-muted-foreground">
              No complaints match the current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <Card
              key={c.id}
              className={cn(
                'animate-slide-up border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                c.priority === 'Critical' && 'border-red-500/30 bg-red-500/[0.02]'
              )}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                        {c.ticket_id}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.duplicate_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <TrendingUp className="h-3 w-3" />
                          {c.duplicate_count + 1} reports
                        </span>
                      )}
                      {c.photo_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          <ImageIcon className="h-3 w-3" />
                          Proof Attached
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold text-foreground">{c.title || 'Complaint'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    
                    {/* Thumbnail preview on card */}
                    {c.photo_url && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.photo_url}
                            alt={`Proof thumbnail ${c.ticket_id}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop';
                            }}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                          Citizen attached photo proof
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.category}</span>
                      {c.location && (
                        <>
                          <span>•</span>
                          <span>{c.location}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                  <Button onClick={() => openUpdate(c)} variant="outline" size="sm" className="gap-2 shrink-0">
                    <MessageSquare className="h-4 w-4" />
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.ticket_id}
              <StatusBadge status={selected?.status || ''} />
              <PriorityBadge priority={selected?.priority || ''} />
            </DialogTitle>
            <DialogDescription>
              Update the status and add remarks for this complaint.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</p>
                  <p className="mt-1 text-sm font-semibold">{selected.title || 'Untitled complaint'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm">{selected.description}</p>
                </div>

                {/* Proof of complaint image display */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
                      Proof of Complaint
                    </span>
                    {selected.photo_url && (
                      <span className="text-[10px] text-sky-500 font-normal">Citizen Attachment</span>
                    )}
                  </p>
                  {selected.photo_url ? (
                    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-background/90 p-1 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.photo_url}
                        alt={`Proof for ${selected.ticket_id}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop';
                        }}
                        className="max-h-72 w-full rounded-lg object-contain bg-black/5 dark:bg-white/5 transition-transform group-hover:scale-[1.01]"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground bg-muted/20">
                      No photo proof uploaded by citizen for this ticket.
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {selected.category}
                  {selected.location && ` • ${selected.location}`}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add internal remarks or resolution notes..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'sky' | 'red' | 'orange' | 'emerald';
}) {
  const colors = {
    sky: 'text-sky-500 bg-sky-500/10',
    red: 'text-red-500 bg-red-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
  };
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
