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
  QrCode,
  ExternalLink,
  MapPin,
  Copy,
  Check,
  Sparkles,
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
import { ComplaintQrCode } from '@/components/complaint-qr-code';
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
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'actions' | 'qr'>('overview');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('Medium');
  const [assignedOfficer, setAssignedOfficer] = useState<string>('');
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
    const [cRes, oRes] = await Promise.all([
      supabase
        .from('complaints')
        .select('*')
        .eq('department', deptName)
        .order('created_at', { ascending: false }),
      supabase
        .from('officers')
        .select('*')
        .order('name', { ascending: true }),
    ]);

    if (cRes.error) {
      toast.error('Failed to load complaints');
    } else {
      setComplaints((cRes.data || []) as Complaint[]);
    }

    if (oRes.data) {
      setOfficers(oRes.data);
    }
    setLoading(false);
  }, [deptName]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return complaints
      .filter((c) => !c.duplicate_of)
      .filter((c) => (statusFilter === 'all' ? true : c.status === statusFilter))
      .filter((c) =>
        search.trim()
          ? c.description.toLowerCase().includes(search.toLowerCase()) ||
            c.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
            (c.title || '').toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  const QUICK_REMARKS = [
    'Field inspection team dispatched to site.',
    'Investigation completed. Maintenance work underway.',
    'Awaiting replacement materials from municipal depot.',
    'Citizen contacted; preliminary updates shared.',
    'Work completed successfully and verified on site.',
    'Issue escalated to zonal senior engineer.',
  ];

  function openUpdate(c: Complaint, initialTab: 'overview' | 'actions' | 'qr' = 'overview') {
    setSelected(c);
    setModalTab(initialTab);
    setNewStatus(c.status);
    setNewPriority(c.priority || 'Medium');
    setAssignedOfficer((c as any).assigned_officer_id || '');
    setRemarks(c.officer_remarks || '');
  }

  function handleAutoAssign() {
    if (!selected) return;
    const deptOfficers = officers.filter(
      (o) => !selected.department || o.department === selected.department
    );
    const pool = deptOfficers.length > 0 ? deptOfficers : officers;
    if (pool.length === 0) {
      toast.error('No registered officers available in roster.');
      return;
    }
    const best = [...pool].sort(
      (a, b) => (a.current_complaints - b.current_complaints) || (b.overall_score - a.overall_score)
    )[0];
    setAssignedOfficer(best._id);
    toast.success(`AI assigned to Officer ${best.name} (${best.designation})`);
  }

  async function handleSave() {
    if (!selected || !newStatus) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        priority: newPriority,
        officer_remarks: remarks.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (assignedOfficer) {
        updates.assigned_officer_id = assignedOfficer;
        const matched = officers.find((o) => o._id === assignedOfficer);
        if (matched) updates.assigned_officer_name = matched.name;
      }
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
        action: `Status: ${newStatus}, Priority: ${newPriority}`,
        from_status: selected.status,
        to_status: newStatus,
        remarks: remarks.trim() || null,
      });

      toast.success(`Complaint ${selected.ticket_id} updated successfully!`);
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
              onClick={() => openUpdate(c, 'overview')}
              className={cn(
                'group cursor-pointer animate-slide-up border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg',
                c.priority === 'Critical' && 'border-red-500/40 bg-red-500/[0.03]'
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
                    <p className="mt-2 font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {c.title || 'Complaint'}
                    </p>
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
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-sky-500" />
                            {c.location}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUpdate(c, 'qr');
                      }}
                      className="h-8 gap-1.5 text-xs border-sky-500/30 text-sky-600 hover:bg-sky-500/10 dark:text-sky-400"
                      title="Scan Mobile QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Scan QR</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUpdate(c, 'actions');
                      }}
                      className="h-8 gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Manage Options</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comprehensive Scrollable Department Complaint Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
          {/* Header */}
          <div className="border-b border-border/60 bg-muted/30 p-5 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xl font-bold text-sky-600 dark:text-sky-400">
                  {selected?.ticket_id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selected?.ticket_id) {
                      navigator.clipboard.writeText(selected.ticket_id);
                      toast.success(`Copied ticket ID ${selected.ticket_id}`);
                    }
                  }}
                  title="Copy Ticket ID"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {selected?.status && <StatusBadge status={selected.status} />}
                {selected?.priority && <PriorityBadge priority={selected.priority} />}
                {selected?.department && (
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {selected.department}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/track/${selected?.ticket_id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-500/20 dark:text-sky-400 transition-colors"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Public QR & Tracking</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex gap-1 border-b border-border/50">
              <button
                type="button"
                onClick={() => setModalTab('overview')}
                className={cn(
                  'border-b-2 px-3.5 py-2 text-xs font-semibold transition-all',
                  modalTab === 'overview'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Overview & Evidence
              </button>
              <button
                type="button"
                onClick={() => setModalTab('actions')}
                className={cn(
                  'border-b-2 px-3.5 py-2 text-xs font-semibold transition-all',
                  modalTab === 'actions'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Officer Actions & Options
              </button>
              <button
                type="button"
                onClick={() => setModalTab('qr')}
                className={cn(
                  'border-b-2 px-3.5 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5',
                  modalTab === 'qr'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                Mobile QR Code
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[calc(92vh-140px)]">
            {selected && modalTab === 'overview' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Title</span>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {selected.title || 'Citizen Grievance Submission'}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
                    <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-background/60 p-3 rounded-lg border border-border/40">
                      {selected.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="rounded-lg bg-background p-2.5 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Category</span>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{selected.category || 'General'}</p>
                    </div>
                    <div className="rounded-lg bg-background p-2.5 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Department</span>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{selected.department || 'Unassigned'}</p>
                    </div>
                    <div className="rounded-lg bg-background p-2.5 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Sentiment</span>
                      <p className="text-xs font-semibold capitalize text-foreground mt-0.5">{selected.sentiment || 'Neutral'}</p>
                    </div>
                    <div className="rounded-lg bg-background p-2.5 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Filed Date</span>
                      <p className="text-xs font-semibold text-foreground mt-0.5">
                        {new Date(selected.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selected.location && (
                    <div className="rounded-lg bg-background p-3 border border-border/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Location & GPS</span>
                          <p className="text-xs font-medium text-foreground">{selected.location}</p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-500"
                      >
                        <span>Open in Maps</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Proof Photo */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-sky-500" />
                      Citizen Photo Proof
                    </span>
                    {selected.photo_url && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Attachment Verified</span>
                    )}
                  </div>
                  {selected.photo_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-border/70 bg-black/5 dark:bg-black/30 p-1 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.photo_url}
                        alt={`Proof for ${selected.ticket_id}`}
                        className="max-h-72 w-full object-contain rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground bg-background/50">
                      No photographic proof attached by citizen for this ticket.
                    </div>
                  )}
                </div>

                {/* Existing remarks if any */}
                {selected.officer_remarks && (
                  <div className="rounded-xl border border-border/60 bg-sky-500/5 p-4 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Previous Officer Remarks
                    </span>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {selected.officer_remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selected && modalTab === 'actions' && (
              <div className="space-y-6">
                {/* Status flow selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Workflow Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STATUS_FLOW.map((s) => {
                      const isCurrent = newStatus === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewStatus(s)}
                          className={cn(
                            'rounded-xl border p-3 text-left transition-all',
                            isCurrent
                              ? 'border-sky-600 bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20 font-bold'
                              : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                          )}
                        >
                          <div className="text-xs font-bold">{s}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {s === 'Registered' && 'New grievance'}
                            {s === 'Assigned' && 'Officer allocated'}
                            {s === 'In Progress' && 'Under active repair'}
                            {s === 'Resolved' && 'Closed & verified'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => {
                      const isCurrent = newPriority === p;
                      const badgeColors: Record<string, string> = {
                        Critical: 'border-red-500 bg-red-500/10 text-red-600',
                        High: 'border-orange-500 bg-orange-500/10 text-orange-600',
                        Medium: 'border-amber-500 bg-amber-500/10 text-amber-600',
                        Low: 'border-blue-500 bg-blue-500/10 text-blue-600',
                      };
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={cn(
                            'rounded-xl border p-2.5 text-center text-xs font-bold transition-all',
                            isCurrent
                              ? `${badgeColors[p]} ring-2 ring-sky-500/30`
                              : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Officer Assignment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Assign to Department Officer
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoAssign}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>AI Auto-Assign</span>
                    </button>
                  </div>
                  <Select value={assignedOfficer} onValueChange={setAssignedOfficer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select officer from roster..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {officers.map((o) => (
                        <SelectItem key={o._id} value={o._id}>
                          {o.name} • {o.designation} ({o.department}) — {o.current_complaints} active
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Action Remarks Chips */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Quick Action Presets (Click to insert)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REMARKS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setRemarks((prev) => (prev ? `${prev}\n${preset}` : preset));
                        }}
                        className="rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-500/30 transition-all text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Officer remarks textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Officer Remarks & Official Resolution Notes
                  </label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter action taken, investigation outcome, citizen communication, or field dispatch notes..."
                    className="min-h-[110px] resize-none"
                  />
                </div>
              </div>
            )}

            {selected && modalTab === 'qr' && (
              <div className="space-y-6 flex flex-col items-center justify-center py-4">
                <ComplaintQrCode
                  ticketId={selected.ticket_id}
                  title={selected.title || ''}
                  department={selected.department || ''}
                  status={selected.status}
                  priority={selected.priority}
                  size={200}
                  showCard={false}
                />

                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 max-w-md text-center space-y-1">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    Mobile Phone Verification & Live Tracking
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Scan with standard iOS Camera app or Google Lens on Android. The mobile phone directly displays real-time grievance stages, SLA timeline, and officer updates.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewStatus('Resolved');
                  toast.info('Status set to Resolved. Click "Save Updates" to commit.');
                }}
                className="text-xs text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                1-Click Resolve
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Updates
              </Button>
            </div>
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
