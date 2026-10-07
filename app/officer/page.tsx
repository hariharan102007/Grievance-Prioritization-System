'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Brain, Zap, Droplet, HardHat, Trash2, HeartPulse, Shield,
  AlertTriangle, Clock, CheckCircle2, TrendingUp, Users, Activity,
  ChevronRight, MapPin, Star, Loader2, RefreshCw, UserPlus,
  ArrowUp, Minus, ArrowDown, Inbox, Search, Filter, Building2, ArrowRight
} from 'lucide-react';
import { supabase, type Complaint, PRIORITY_ORDER, STATUS_FLOW } from '@/lib/supabase';
import { readPortalSession } from '@/lib/portal-auth';
import { predictSLA, calcPriorityScore, getPriorityColor } from '@/lib/officer-engine';
import { DEPARTMENTS_DATA, getIconComponent } from '@/lib/departments-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const DEPT_THEME: Record<string, { icon: React.ComponentType<{className?:string}>; color: string; bg: string }> = {
  'Electricity Department':  { icon: Zap,        color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  'Water Department':        { icon: Droplet,     color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
  'Public Works Department': { icon: HardHat,     color: 'text-orange-500',  bg: 'bg-orange-500/10'  },
  'Sanitation Department':   { icon: Trash2,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Health Department':       { icon: HeartPulse,  color: 'text-rose-500',    bg: 'bg-rose-500/10'    },
  'Police Department':       { icon: Shield,      color: 'text-indigo-500',  bg: 'bg-indigo-500/10'  },
};

type Officer = {
  _id: string; name: string; employee_id: string; department: string;
  designation: string; status: string; current_complaints: number;
  overall_score: number; performance: { resolution_rate: number; sla_compliance: number; citizen_rating: number; };
};

type EnrichedComplaint = Complaint & { ai_score: number; sla: ReturnType<typeof predictSLA> };

function SLABadge({ sla }: { sla: ReturnType<typeof predictSLA> }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sla.bg, sla.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', sla.color.replace('text-','bg-'))} />
      {sla.label}
    </span>
  );
}

export default function OfficerPage() {
  const router = useRouter();

  useEffect(() => {
    const session = readPortalSession();
    if (!session || session.role !== 'officer') {
      router.replace('/officer/login');
    }
  }, [router]);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue'|'departments'|'officers'|'sla'>('queue');

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (data) setComplaints(data as Complaint[]);
    setLoading(false);
  }, []);

  const loadOfficers = useCallback(async () => {
    try {
      const r = await fetch('http://localhost:5000/api/officers');
      if (r.ok) setOfficers(await r.json());
    } catch { /* backend may not be running */ }
  }, []);

  useEffect(() => { loadComplaints(); loadOfficers(); }, [loadComplaints, loadOfficers]);

  const enriched: EnrichedComplaint[] = useMemo(() =>
    complaints
      .filter(c => !c.duplicate_of)
      .map(c => ({
        ...c,
        ai_score: calcPriorityScore({ ...c, department: c.department || '', created_at: c.created_at }),
        sla: predictSLA({ priority: c.priority, department: c.department || '', created_at: c.created_at }),
      }))
  , [complaints]);

  const priorityQueue = useMemo(() =>
    [...enriched].filter(c => c.status !== 'Resolved').sort((a, b) => b.ai_score - a.ai_score)
  , [enriched]);

  const stats = useMemo(() => ({
    total:    enriched.filter(c => c.status !== 'Resolved').length,
    critical: enriched.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length,
    pending:  enriched.filter(c => c.status === 'Registered').length,
    slaRisk:  enriched.filter(c => ['HighRisk','Overdue'].includes(c.sla.risk) && c.status !== 'Resolved').length,
    resolved: enriched.filter(c => c.status === 'Resolved').length,
  }), [enriched]);

  const filtered = useMemo(() =>
    priorityQueue
      .filter(c => statusFilter === 'all' || c.status === statusFilter)
      .filter(c => deptFilter === 'all' || c.department === deptFilter)
      .filter(c => !search.trim() || c.description.toLowerCase().includes(search.toLowerCase()) || c.ticket_id.toLowerCase().includes(search.toLowerCase()))
  , [priorityQueue, statusFilter, deptFilter, search]);

  const departments = useMemo(() => {
    const set = new Set(complaints.map(c => c.department).filter(Boolean) as string[]);
    return Array.from(set).sort();
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
      const updates: Record<string, unknown> = { status: newStatus, officer_remarks: remarks.trim() || null, updated_at: new Date().toISOString() };
      if (newStatus === 'Resolved') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('complaints').update(updates).eq('id', selected.id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({ complaint_id: selected.id, action: `Status updated to ${newStatus}`, from_status: selected.status, to_status: newStatus, remarks: remarks.trim() || null });
      toast.success(`Updated to ${newStatus}`);
      setSelected(null);
      loadComplaints();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally { setSaving(false); }
  }

  const emergencyComplaints = useMemo(() => enriched.filter(c => c.priority === 'Critical' && c.status !== 'Resolved'), [enriched]);

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <section className="border-b border-border/60 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Brain className="h-6 w-6 text-violet-500" />
                <h1 className="text-2xl font-bold tracking-tight">Officer Intelligence Command Center</h1>
              </div>
              <p className="text-sm text-muted-foreground">AI-driven officer management, smart complaint assignment, and SLA risk prediction.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-violet-500/10 p-3 text-violet-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">Officer Management</p>
                  <p className="mt-2 text-xs text-muted-foreground">Registration, verification, training, assignment, and performance tracking.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-sky-500/10 p-3 text-sky-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">AI Priority Queue</p>
                  <p className="mt-2 text-xs text-muted-foreground">Complaint triage based on urgency, location, workload, and officer skills.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">SLA Monitoring</p>
                  <p className="mt-2 text-xs text-muted-foreground">Predict at-risk cases, monitor timelines, and surface high-risk SLA breaches.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { loadComplaints(); loadOfficers(); }} className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
                <Link href="/officer/register">
                  <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700">
                    <UserPlus className="h-3.5 w-3.5" /> Register Officer
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label:'Active',   value: stats.total,    icon: Activity,      color:'text-blue-500',    bg:'bg-blue-500/10'    },
              { label:'Pending',  value: stats.pending,  icon: Clock,         color:'text-amber-500',   bg:'bg-amber-500/10'   },
              { label:'Critical', value: stats.critical, icon: AlertTriangle, color:'text-red-500',     bg:'bg-red-500/10'     },
              { label:'SLA Risk', value: stats.slaRisk,  icon: TrendingUp,    color:'text-orange-500',  bg:'bg-orange-500/10'  },
              { label:'Resolved', value: stats.resolved, icon: CheckCircle2,  color:'text-emerald-500', bg:'bg-emerald-500/10' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
                  <div className={cn('mb-1 inline-flex rounded-lg p-1.5', s.bg)}>
                    <Icon className={cn('h-4 w-4', s.color)} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      {emergencyComplaints.length > 0 && (
        <div className="bg-red-500/10 border-y border-red-500/20 px-4 py-3">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              {emergencyComplaints.length} CRITICAL complaint{emergencyComplaints.length > 1 ? 's' : ''} need immediate attention
            </span>
            {emergencyComplaints.slice(0, 2).map(c => (
              <button key={c.id} onClick={() => openUpdate(c)}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors">
                {c.ticket_id} � {c.department?.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-1 w-fit">
          {(['queue', 'departments', 'officers', 'sla'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>
              {tab === 'queue' ? 'AI Priority Queue' : tab === 'departments' ? 'Department Operations' : tab === 'officers' ? 'Officer Roster' : 'SLA Monitor'}
            </button>
          ))}
        </div>

        {/* Tab: Department Operations */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-violet-500" />
                  Government Department Management
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select a department to manage officer assignments, triage queues, SLA targets, and departmental operations.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {DEPARTMENTS_DATA.map((dept) => {
                const Icon = getIconComponent(dept.iconName);
                const deptComplaints = complaints.filter(c => c.department === dept.name && !c.duplicate_of);
                const activeCount = deptComplaints.filter(c => c.status !== 'Resolved').length;
                const criticalCount = deptComplaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;
                const resolvedCount = deptComplaints.filter(c => c.status === 'Resolved').length;

                return (
                  <Card key={dept.slug} className="border-border/60 bg-card/70 backdrop-blur-sm transition-all hover:border-violet-500/40 hover:shadow-lg flex flex-col justify-between">
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn('flex h-13 w-13 items-center justify-center rounded-2xl border', dept.bg, dept.border)}>
                            <Icon className={cn('h-6 w-6', dept.color)} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                            {dept.targetSlaHours}h SLA Guarantee
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dept.tagline}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center border border-border/40">
                        <div>
                          <div className="text-base font-bold text-foreground">{activeCount}</div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Active</div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{resolvedCount}</div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Resolved</div>
                        </div>
                        <div>
                          <div className={cn("text-base font-bold", criticalCount > 0 ? "text-red-500" : "text-muted-foreground")}>{criticalCount}</div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Critical</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-violet-500" />
                          <span>Chief: {dept.leadOfficer.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-violet-500" />
                          <span>Helpline: {dept.helpline}</span>
                        </div>
                      </div>

                      <Link href={`/officer/department/${encodeURIComponent(dept.name)}`} className="pt-2">
                        <Button className="w-full gap-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md">
                          Manage Department Portal
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: AI Priority Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-52"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Inbox className="mb-3 h-10 w-10 opacity-30" />
                <p>No complaints match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((c, i) => {
                  const colors = getPriorityColor(c.ai_score);
                  const theme = DEPT_THEME[c.department || ''];
                  const DeptIcon = theme?.icon;
                  return (
                    <div key={c.id}
                      className="group rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-violet-500/20">
                      <div className="flex items-start gap-4">
                        {/* Rank */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-xs font-bold">
                          {i + 1}
                        </div>

                        {/* Score bar */}
                        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
                          <span className={cn('text-lg font-bold', c.ai_score >= 80 ? 'text-red-500' : c.ai_score >= 60 ? 'text-orange-500' : c.ai_score >= 40 ? 'text-amber-500' : 'text-blue-500')}>
                            {c.ai_score}
                          </span>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div className={cn('h-full rounded-full', colors.bar)} style={{ width: `${c.ai_score}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">score</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{c.ticket_id}</span>
                            <PriorityBadge priority={c.priority} />
                            <StatusBadge status={c.status} />
                            <SLABadge sla={c.sla} />
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{c.description}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                            {DeptIcon && <span className={cn('flex items-center gap-1', theme?.color)}><DeptIcon className="h-3 w-3" />{c.department}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.sla.ageHours.toFixed(1)}h ago</span>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" onClick={() => openUpdate(c)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          Update
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Officer Roster */}
        {activeTab === 'officers' && (
          <div className="space-y-4">
            {officers.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No officers loaded. Make sure the backend is running.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={loadOfficers}>Retry</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {officers.map(o => {
                  const theme = DEPT_THEME[o.department];
                  const Icon = theme?.icon || Activity;
                  const statusColors: Record<string, string> = {
                    active: 'bg-emerald-500', leave: 'bg-amber-500', unavailable: 'bg-red-500', pending: 'bg-gray-400',
                  };
                  return (
                    <Link key={o._id} href={`/officer/${o._id}`}>
                      <div className="group h-full rounded-xl border border-border/60 bg-card/60 p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-violet-500/20 cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-xl', theme?.bg || 'bg-muted')}>
                              <Icon className={cn('h-5 w-5', theme?.color || 'text-muted-foreground')} />
                              <span className={cn('absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background', statusColors[o.status] || 'bg-gray-400')} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{o.name}</p>
                              <p className="text-xs text-muted-foreground">{o.designation}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-violet-500">{o.overall_score}<span className="text-xs text-muted-foreground">/100</span></div>
                          </div>
                        </div>

                        <p className="mb-3 text-xs text-muted-foreground">{o.department}</p>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label:'Rate', value: `${o.performance?.resolution_rate ?? 0}%` },
                            { label:'SLA',  value: `${o.performance?.sla_compliance ?? 0}%`  },
                            { label:'Load', value: o.current_complaints                       },
                          ].map(m => (
                            <div key={m.label} className="rounded-lg bg-muted/50 px-2 py-1.5">
                              <div className="text-sm font-bold">{m.value}</div>
                              <div className="text-[10px] text-muted-foreground">{m.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {o.performance?.citizen_rating?.toFixed(1) ?? '�'}/5
                          </div>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                            o.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                            o.status === 'leave'  ? 'bg-amber-500/10  text-amber-600'  :
                                                    'bg-red-500/10     text-red-600'
                          )}>{o.status}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: SLA Monitor */}
        {activeTab === 'sla' && (
          <div className="space-y-6">
            {(['Overdue','HighRisk','AtRisk','OnTrack'] as const).map(risk => {
              const group = enriched.filter(c => c.sla.risk === risk && c.status !== 'Resolved');
              if (group.length === 0) return null;
              const titles: Record<string, string> = { Overdue:'?? Overdue', HighRisk:'?? High Risk', AtRisk:'?? At Risk', OnTrack:'?? On Track' };
              return (
                <div key={risk}>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{titles[risk]} � {group.length} complaint{group.length !== 1 ? 's' : ''}</h3>
                  <div className="space-y-2">
                    {group.map(c => (
                      <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 p-4">
                        <SLABadge sla={c.sla} />
                        <span className="text-xs font-mono text-muted-foreground">{c.ticket_id}</span>
                        <span className="flex-1 text-sm truncate">{c.description.slice(0, 80)}�</span>
                        <PriorityBadge priority={c.priority} />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {c.sla.remainingHours > 0 ? `${c.sla.remainingHours}h left` : `${Math.abs(c.sla.remainingHours)}h over`}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => openUpdate(c)}>Update</Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Update Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
            <DialogDescription>{selected?.ticket_id} � {selected?.department}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selected?.photo_url && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proof / Photo</div>
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.photo_url} alt={`Proof for ${selected.ticket_id}`} className="max-h-72 w-full object-contain rounded-md border border-border/60" />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Move to status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Officer remarks</label>
              <textarea
                value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Add notes about action taken�"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
