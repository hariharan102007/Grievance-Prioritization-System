'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Send,
  Search,
  Filter,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader as Loader2,
  MapPin,
  TrendingUp,
  Building2,
  FileText,
  UploadCloud,
  X,
  Star,
  Image as ImageIcon,
  LocateFixed,
  Crosshair,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ComplaintQrCode } from '@/components/complaint-qr-code';
import { detectCurrentGpsLocation } from '@/lib/location-helper';
import {
  getDepartmentBySlug,
  getIconComponent,
  DepartmentInfo,
  DEPARTMENTS_DATA,
} from '@/lib/departments-data';
import {
  supabase,
  type Complaint,
  PRIORITY_ORDER,
  STATUS_FLOW,
} from '@/lib/supabase';
import { processComplaint, type AiResult } from '@/lib/ai-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // used in file complaint form
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // used in language select for file complaint form
import { cn } from '@/lib/utils';

export default function SeparateDepartmentPage({
  params,
}: {
  params: { deptSlug: string };
}) {
  const router = useRouter();
  const deptSlug = params.deptSlug;

  // Retrieve department metadata
  const department: DepartmentInfo = useMemo(() => {
    const found = getDepartmentBySlug(deptSlug);
    if (found) return found;
    // Fallback to Water Department if not found
    return DEPARTMENTS_DATA[0];
  }, [deptSlug]);

  const DepartmentIcon = getIconComponent(department.iconName);

  // Department State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'file' | 'officers' | 'services'>('board');

  // Board Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQrComplaint, setSelectedQrComplaint] = useState<Complaint | null>(null);



  // File Complaint Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<'Auto' | 'English' | 'Hindi' | 'Tamil'>('Auto');

  const handleDetectGps = () => {
    detectCurrentGpsLocation((res) => {
      setLocation(res.formattedText);
    }, setDetectingGps);
  };

  // Existing complaints for duplicate check
  const [existingComplaints, setExistingComplaints] = useState<
    { id: string; description: string }[]
  >([]);

  // Load department complaints
  const loadDepartmentComplaints = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('department', department.name)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComplaints(data as Complaint[]);
    }
    setLoading(false);

    // Load existing for duplicate check
    const { data: allComp } = await supabase
      .from('complaints')
      .select('id, description')
      .limit(200);
    if (allComp) setExistingComplaints(allComp);
  }, [department.name]);

  useEffect(() => {
    loadDepartmentComplaints();
  }, [loadDepartmentComplaints]);

  // Real-time AI preview for direct complaint tab
  const livePreview: AiResult | null = useMemo(() => {
    if (description.trim().length < 10) return null;
    const result = processComplaint(description, existingComplaints);
    return {
      ...result,
      department: department.name, // Lock to this department
      language: language === 'Auto' ? result.language : language,
    };
  }, [description, existingComplaints, department.name, language]);

  // Handle Photo Change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit direct complaint for this department
  async function handleSubmitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please describe your issue in at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = processComplaint(description, existingComplaints);
      const insertPayload: Record<string, unknown> = {
        ticket_id: result.ticketId,
        title: title.trim() || description.trim().slice(0, 80),
        description: description.trim(),
        category: department.category,
        department: department.name, // Explicitly target this department!
        priority: result.priority,
        status: result.duplicateOf ? 'Assigned' : 'Registered',
        location: location.trim() || null,
        language: language === 'Auto' ? result.language : language,
        sentiment: result.sentiment,
        duplicate_of: result.duplicateOf,
        duplicate_count: result.duplicateOf ? 1 : 0,
        photo_url: photo,
      };

      const { error } = await supabase.from('complaints').insert(insertPayload);
      if (error) throw error;

      toast.success(`Complaint registered under ${department.name}`, {
        description: `Ticket ID: ${result.ticketId} • Priority: ${result.priority}`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setPhoto(null);

      // Reload complaints board
      await loadDepartmentComplaints();
      setActiveTab('board');
    } catch (err) {
      toast.error('Failed to submit complaint', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Filter complaints
  const filteredComplaints = useMemo(() => {
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

  // Compute live stats
  const stats = useMemo(() => {
    const active = complaints.filter((c) => !c.duplicate_of && c.status !== 'Resolved');
    return {
      total: complaints.filter((c) => !c.duplicate_of).length,
      active: active.length,
      critical: active.filter((c) => c.priority === 'Critical').length,
      high: active.filter((c) => c.priority === 'High').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
    };
  }, [complaints]);



  return (
    <div className="min-h-screen bg-mesh pb-20">
      {/* Top Banner Hero */}
      <section
        className={cn(
          'relative overflow-hidden border-b border-border/60 py-12 text-white shadow-lg bg-gradient-to-r',
          department.gradient
        )}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb back */}
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/40 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Departments Directory
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                <DepartmentIcon className="h-9 w-9 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
                    {department.name}
                  </h1>
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                    Official Site
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-white/90 max-w-2xl">
                  {department.tagline}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-white/90" />
                    <span>Helpline: {department.helpline}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-white/90" />
                    <span>Email: {department.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-white/90" />
                    <span>Chief: {department.leadOfficer.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => setActiveTab('file')}
                size="lg"
                className="gap-2 bg-white text-slate-900 font-semibold hover:bg-slate-100 shadow-xl"
              >
                <Send className="h-4 w-4 text-cyan-600" />
                Lodge Direct Complaint
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto max-w-7xl px-4 -mt-6 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60 shadow-lg backdrop-blur-md bg-card/90">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{loading ? '...' : stats.active}</div>
                <div className="text-xs text-muted-foreground">Active Complaints</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-lg backdrop-blur-md bg-card/90">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{loading ? '...' : stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved Cases</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-lg backdrop-blur-md bg-card/90">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{loading ? '...' : stats.critical}</div>
                <div className="text-xs text-muted-foreground">Critical Urgency</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-lg backdrop-blur-md bg-card/90">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{department.targetSlaHours}h SLA</div>
                <div className="text-xs text-muted-foreground">Target Resolution</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-border/60 bg-card/50 p-1.5">
          <button
            onClick={() => setActiveTab('board')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === 'board'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-4 w-4 text-cyan-500" />
            Complaint Live Queue ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === 'file'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Send className="h-4 w-4 text-emerald-500" />
            Lodge Direct Complaint
          </button>
          <button
            onClick={() => setActiveTab('officers')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === 'officers'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4 text-violet-500" />
            Department Officers ({department.officers.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === 'services'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="h-4 w-4 text-amber-500" />
            Services & SLA Standards
          </button>
        </div>

        {/* Tab 1: Live Complaint Board */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search complaint description or ticket ID..."
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-48">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex py-16 justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : filteredComplaints.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500 opacity-80" />
                  <p className="text-lg font-semibold">No complaints found</p>
                  <p className="text-sm text-muted-foreground">
                    There are no complaints matching your query under {department.name}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((c, i) => (
                  <Card
                    key={c.id}
                    className={cn(
                      'border-border/60 transition-all hover:border-cyan-500/30 hover:shadow-md',
                      c.priority === 'Critical' && 'border-red-500/30 bg-red-500/[0.02]'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                              {i + 1}
                            </span>
                            <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                              {c.ticket_id}
                            </span>
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                            {c.duplicate_count > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                <TrendingUp className="h-3 w-3" />
                                {c.duplicate_count + 1} citizens affected
                              </span>
                            )}
                            {c.photo_url && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                <ImageIcon className="h-3 w-3" />
                                Proof Attached
                              </span>
                            )}
                          </div>
                          <p className="mt-2 font-semibold text-foreground">
                            {c.title || 'Civic Issue'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {c.description}
                          </p>

                          {/* Proof photo thumbnail on card */}
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
                              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                Citizen attached photo proof
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {c.category}
                            </span>
                            {c.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-cyan-500" />
                                  {c.location}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQrComplaint(c)}
                            className="h-8 gap-1.5 text-xs border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400"
                            title="Scan Mobile QR Code"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Scan QR</span>
                          </Button>
                          <Link href={`/track/${c.ticket_id}`}>
                            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                              <span>Track</span>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Modal for Mobile QR Code on Department Portal */}
            <Dialog open={!!selectedQrComplaint} onOpenChange={() => setSelectedQrComplaint(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="font-mono text-lg font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedQrComplaint?.ticket_id}
                    </DialogTitle>
                    {selectedQrComplaint && (
                      <StatusBadge status={selectedQrComplaint.status} />
                    )}
                  </div>
                  <DialogDescription className="text-xs">
                    Scan with smartphone camera to view live progress on mobile.
                  </DialogDescription>
                </DialogHeader>

                {selectedQrComplaint && (
                  <div className="py-2">
                    <ComplaintQrCode
                      ticketId={selectedQrComplaint.ticket_id}
                      title={selectedQrComplaint.title || ''}
                      department={selectedQrComplaint.department || ''}
                      status={selectedQrComplaint.status}
                      priority={selectedQrComplaint.priority}
                      size={190}
                      showCard={false}
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Tab 2: Direct Complaint Form */}
        {activeTab === 'file' && (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card className="border-border/60 shadow-xl">
                <CardHeader className="border-b border-border/60 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-cyan-500" />
                    Lodge Complaint to {department.name}
                  </CardTitle>
                  <CardDescription>
                    Your submission will be registered directly under {department.name} with real-time AI triage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitComplaint} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Complaint Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`e.g., Issue related to ${department.category}...`}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={`Describe the problem in detail (e.g. location, severity, duration)...`}
                        className="mt-1.5 min-h-[120px]"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Location / Address
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectGps}
                            disabled={detectingGps}
                            className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-600 transition-colors hover:bg-cyan-500/20 dark:text-cyan-400"
                            title="Auto-detect GPS location"
                          >
                            {detectingGps ? (
                              <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />
                            ) : (
                              <LocateFixed className="h-3 w-3 text-cyan-500" />
                            )}
                            <span>{detectingGps ? 'Detecting...' : 'Use GPS'}</span>
                          </button>
                        </div>
                        <div className="relative mt-1.5">
                          <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Street, Ward, Landmark or click GPS..."
                            className="pr-9"
                          />
                          <button
                            type="button"
                            onClick={handleDetectGps}
                            disabled={detectingGps}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-cyan-500 transition-colors"
                            title="Detect current location"
                          >
                            {detectingGps ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />
                            ) : (
                              <Crosshair className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Language
                        </label>
                        <Select
                          value={language}
                          onValueChange={(v) => setLanguage(v as any)}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auto">Auto Detect</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Attach Photo Proof (Optional)
                      </label>
                      {photo ? (
                        <div className="relative mt-2 rounded-lg border border-border/60 p-2 bg-muted/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt="Attachment preview"
                            className="max-h-48 w-full rounded object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setPhoto(null)}
                            className="absolute top-3 right-3 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <UploadCloud className="h-5 w-5 text-cyan-500" />
                            <span>Click to upload image (max 2MB)</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        'w-full gap-2 text-sm font-semibold shadow-lg text-white bg-gradient-to-r',
                        department.gradient
                      )}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit Complaint to {department.name}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* AI Live Preview Card */}
            <div className="lg:col-span-2">
              <Card className="border-cyan-500/30 bg-card/80 backdrop-blur-md shadow-lg sticky top-20">
                <CardHeader className="bg-cyan-500/10 border-b border-cyan-500/20">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    <Building2 className="h-4 w-4" />
                    AI Triage Engine Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {livePreview ? (
                    <>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs text-muted-foreground">Target Dept:</span>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          {livePreview.department}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs text-muted-foreground">Assigned Priority:</span>
                        <PriorityBadge priority={livePreview.priority} />
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs text-muted-foreground">Sentiment:</span>
                        <span className="text-xs font-semibold capitalize">
                          {livePreview.sentiment}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs text-muted-foreground">Language:</span>
                        <span className="text-xs font-semibold">{livePreview.language}</span>
                      </div>
                      {livePreview.duplicateOf && (
                        <div className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                          Similar existing complaint detected. Will be linked to increase priority score!
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Type at least 10 characters in the description box to see real-time AI triage analysis.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 3: Officers Roster */}
        {activeTab === 'officers' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {department.officers.map((off) => (
                <Card key={off.id} className="border-border/60 shadow-md">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 font-bold">
                          {off.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{off.name}</h4>
                          <p className="text-xs text-muted-foreground">{off.designation}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                          off.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : off.status === 'On Field'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-slate-500/10 text-slate-500'
                        )}
                      >
                        {off.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-border/40">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">SLA Compliance</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{off.slaCompliance}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Citizen Rating</span>
                        <span className="font-bold text-amber-500 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500" />
                          {off.rating} / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{off.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Services & SLA Standards */}
        {activeTab === 'services' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-500" />
                  Key Civic Services Handled
                </CardTitle>
                <CardDescription>
                  Issues resolved under {department.name} governance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {department.services.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{service}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-500" />
                  Official SLA & Contact Helpdesk
                </CardTitle>
                <CardDescription>
                  Escalation pathways and resolution targets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4">
                  <h4 className="font-bold text-cyan-700 dark:text-cyan-300">
                    Resolution SLA Guarantee
                  </h4>
                  <p className="mt-1 text-muted-foreground">
                    Complaints logged under {department.name} carry a maximum resolution SLA target of{' '}
                    <strong className="text-foreground">{department.targetSlaHours} hours</strong>. Critical emergencies are dispatched within 60 minutes.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Emergency Hotline:</span>
                    <span className="font-bold text-foreground font-mono">{department.helpline}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Support Email:</span>
                    <span className="font-bold text-foreground font-mono">{department.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Chief Engineer:</span>
                    <span className="font-bold text-foreground">{department.leadOfficer.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>


    </div>
  );
}
