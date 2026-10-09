'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Clock, Building2, Globe, Copy, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Loader as Loader2, Share2, History, QrCode } from 'lucide-react';
import {
  supabase,
  type Complaint,
  type AuditLog,
  STATUS_FLOW,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import { ComplaintQrCode } from '@/components/complaint-qr-code';
import { cn } from '@/lib/utils';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);

      const cleanTicket = (ticketId || '').trim().toUpperCase();

      // 1. Direct fetch from backend database API
      try {
        const res = await fetch(`/api/complaints/${encodeURIComponent(cleanTicket)}`);
        if (res.ok) {
          const compData = await res.json();
          if (compData && compData.ticket_id) {
            setComplaint(compData as Complaint);
            // Fetch audit logs
            const logRes = await fetch(`/api/audit-logs?complaint_id=${encodeURIComponent(compData.id)}`);
            if (logRes.ok) {
              const logData = await logRes.json();
              if (Array.isArray(logData)) setLogs(logData);
            }
            setLoading(false);
            return;
          }
        }
      } catch (directErr) {
        console.warn('[Direct API fetch note]:', directErr);
      }

      // 2. Query via Supabase client layer
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('ticket_id', cleanTicket)
        .maybeSingle();

      if (error) {
        toast.error('Failed to load complaint');
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setComplaint(data as Complaint);
      const { data: logData } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('complaint_id', (data as Complaint).id)
        .order('created_at', { ascending: true });

      if (logData) setLogs(logData as AuditLog[]);
      setLoading(false);
    })();
  }, [ticketId]);

  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (notFound || !complaint) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-bold">Complaint not found</h1>
        <p className="mt-2 text-muted-foreground">
          No complaint with ticket ID{' '}
          <span className="font-mono font-semibold">{ticketId}</span> exists.
        </p>
        <Button onClick={() => router.push('/')} className="mt-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  const currentStep = STATUS_FLOW.indexOf(complaint.status as (typeof STATUS_FLOW)[number]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="animate-slide-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold text-sky-600 dark:text-sky-400">
                {complaint.ticket_id}
              </h1>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Filed {new Date(complaint.created_at).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Progress tracker */}
        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Resolution Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {STATUS_FLOW.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                          done
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-border bg-background text-muted-foreground',
                          active && 'ring-4 ring-sky-500/20'
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-semibold">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium',
                          done ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className={cn(
                          'mx-2 h-0.5 flex-1 rounded-full transition-all',
                          i < currentStep ? 'bg-sky-500' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 md:grid-cols-5">
          {/* Details */}
          <div className="md:col-span-3 space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Complaint Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{complaint.description}</p>
                </div>
                    {complaint.photo_url && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proof / Photo</div>
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={complaint.photo_url}
                            alt={`Proof for ${complaint.ticket_id}`}
                            referrerPolicy="no-referrer"
                            className="max-h-80 w-full object-contain rounded-md border border-border/60"
                          />
                        </div>
                      </div>
                    )}
                {complaint.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Location
                      </div>
                      <p className="mt-0.5 text-sm">{complaint.location}</p>
                    </div>
                  </div>
                )}
                {complaint.officer_remarks && (
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Officer Remarks
                    </div>
                    <p className="mt-1 text-sm">{complaint.officer_remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {logs.length > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4 text-sky-500" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                          {logs.length > 1 && <div className="h-full w-px bg-border" />}
                        </div>
                        <div className="pb-2">
                          <div className="text-sm font-medium">{log.action}</div>
                          {log.remarks && (
                            <div className="text-xs text-muted-foreground">{log.remarks}</div>
                          )}
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI metadata & Mobile QR */}
          <div className="md:col-span-2 space-y-4">
            <ComplaintQrCode
              ticketId={complaint.ticket_id}
              title={complaint.title || undefined}
              department={complaint.department || undefined}
              status={complaint.status}
              priority={complaint.priority}
            />

            <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Analysis</CardTitle>
                <CardDescription className="text-xs">
                  Automated processing results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaRow icon={Building2} label="Category" value={complaint.category || '-'} />
                <MetaRow icon={Building2} label="Department" value={complaint.department || '-'} />
                <MetaRow icon={Globe} label="Language" value={complaint.language} />
                <MetaRow icon={Clock} label="Sentiment" value={complaint.sentiment} capitalize />
                {complaint.duplicate_of && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                    <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <div className="text-xs">
                      <div className="font-semibold text-amber-700 dark:text-amber-400">
                        Duplicate Report
                      </div>
                      <div className="text-muted-foreground">
                        Merged with a similar complaint
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {complaint.resolved_at && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Resolved
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(complaint.resolved_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-2.5">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cn('text-sm font-semibold', capitalize && 'capitalize')}>{value}</span>
    </div>
  );
}
