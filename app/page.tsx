'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, Search, MapPin, Sparkles, TriangleAlert as AlertTriangle, Copy, CircleCheck as CheckCircle2, Loader as Loader2, ArrowRight, Activity, Zap, Globe, Route, UploadCloud, X } from 'lucide-react';
import {
  supabase,
  type Complaint,
} from '@/lib/supabase';
import {
  processComplaint,
  type AiResult,
} from '@/lib/ai-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/priority-badge';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<'Auto' | 'English' | 'Hindi' | 'Tamil'>('Auto');

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
  const [existingComplaints, setExistingComplaints] = useState<
    { id: string; description: string }[]
  >([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [trackId, setTrackId] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('id, description')
        .order('created_at', { ascending: false })
        .limit(200);
      if (data) setExistingComplaints(data);
      const { data: recent } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recent) setRecentComplaints(recent as Complaint[]);
    })();
  }, []);

  const livePreview: AiResult | null = useMemo(() => {
    if (description.trim().length < 10) return null;
    const result = processComplaint(description, existingComplaints);
    if (language === 'Auto') return result;
    return { ...result, language };
  }, [description, existingComplaints, language]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please describe your complaint in at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const result = processComplaint(description, existingComplaints);
      const insertPayload: Record<string, unknown> = {
        ticket_id: result.ticketId,
        title: title.trim() || description.trim().slice(0, 80),
        description: description.trim(),
        category: result.category,
        department: result.department,
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

      toast.success(`Complaint registered as ${result.ticketId}`, {
        description: `Routed to ${result.department} • Priority: ${result.priority}`,
      });

      router.push(`/track/${result.ticketId}`);
    } catch (err) {
      toast.error('Failed to submit complaint', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!trackId.trim()) return;
    router.push(`/track/${trackId.trim().toUpperCase()}`);
  }

  return (
    <div className="bg-mesh">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex animate-fade-in items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              AI-Powered Complaint Triage
            </div>
            <h1 className="animate-slide-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your voice,{' '}
              <span className="animate-gradient bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-600 bg-clip-text text-transparent">
                routed to the right hands
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Submit a complaint and our AI instantly categorizes it, scores its
              priority, detects duplicates, and routes it to the correct
              department — so urgent issues reach officers first.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="#submit" className="inline-flex">
                <Button size="lg" className="gap-2">
                  File a Complaint
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#track" className="inline-flex">
                <Button size="lg" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Track a Complaint
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Zap, label: 'Instant Priority Scoring', value: '< 1s' },
              { icon: Globe, label: 'Multilingual Support', value: 'English, Hindi, Tamil' },
              { icon: Copy, label: 'Duplicate Detection', value: 'Automatic' },
              { icon: Route, label: 'Smart Routing', value: '8 Categories' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`animate-slide-up stagger-${i + 1} rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10`}
                >
                  <Icon className="mb-2 h-5 w-5 text-sky-500" />
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Submit + Track */}
      <section id="submit" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Submit form */}
          <div className="animate-slide-up lg:col-span-3">
            <Card className="overflow-hidden border-border/60 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="border-b border-border/60 bg-gradient-to-br from-sky-500/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-sky-500" />
                  File a New Complaint
                </CardTitle>
                <CardDescription>
                  Describe the issue in your own words. The AI will analyze your
                  text in real time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Complaint Title
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Dangerous hanging wire near school"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Complaint Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Live electric wire is hanging near the school gate. Children are at risk of electrocution. Type in Tamil, Hindi, or English."
                      className="min-h-[140px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{description.length}/1000</span>
                      <span>{language === 'Auto' ? 'Language auto-detected' : `${language} selected`}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Complaint Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'Auto' | 'English' | 'Hindi' | 'Tamil')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="Auto">Auto Detect</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Tamil">Tamil</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select the language of your complaint or let the AI auto-detect it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Location <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Near Government School, Sector 7"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Photo Proof Uploader */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Proof of Complaint (Image)</span>
                      <span className="text-xs text-muted-foreground font-normal">Max 2MB</span>
                    </label>
                    
                    {!photo ? (
                      <div className="relative border border-dashed border-border/85 rounded-xl p-6 bg-card/40 hover:bg-muted/10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group hover:border-sky-500/30">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none text-center">
                          <div className="h-10 w-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Click to upload photo proof</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, or WEBP</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-border/80 bg-muted/20 p-2 flex items-center gap-4">
                        <div className="relative h-20 w-24 rounded-lg overflow-hidden border border-border shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt="Complaint proof"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">Uploaded proof</p>
                          <p className="text-[10px] text-muted-foreground">Ready to submit with complaint</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPhoto(null)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full shrink-0 mr-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || description.trim().length < 10}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Live AI preview */}
          <div className="animate-slide-up stagger-2 lg:col-span-2">
            <div className="sticky top-20">
              <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10">
                      <Activity className="h-4 w-4 text-sky-500" />
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse-ring" />
                    </div>
                    Live AI Analysis
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Updates as you type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!livePreview ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Start typing to see the AI analysis
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in space-y-3">
                      <PreviewRow label="Category" value={livePreview.category} />
                      <PreviewRow label="Routed To" value={livePreview.department} />
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-3">
                        <span className="text-xs text-muted-foreground">Priority</span>
                        <PriorityBadge priority={livePreview.priority} />
                      </div>
                      <PreviewRow label="Sentiment" value={livePreview.sentiment} capitalize />
                      <PreviewRow label="Language" value={livePreview.language} />
                      {livePreview.duplicateOf ? (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <div className="text-xs">
                            <div className="font-semibold text-amber-700 dark:text-amber-400">
                              Duplicate Detected
                            </div>
                            <div className="text-muted-foreground">
                              This appears to match an existing complaint and
                              will be merged.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <div className="text-xs">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Unique Complaint
                            </div>
                            <div className="text-muted-foreground">
                              No duplicates detected in recent records.
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-center">
                        <div className="text-xs text-muted-foreground">
                          Ticket ID (preview)
                        </div>
                        <div className="font-mono text-lg font-bold text-sky-600 dark:text-sky-400">
                          {livePreview.ticketId}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Track */}
        <div id="track" className="mt-12">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-sky-500" />
                Track a Complaint
              </CardTitle>
              <CardDescription>
                Enter your ticket ID to check status and history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="e.g. CMP10001"
                  className="font-mono sm:max-w-xs"
                />
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Track Status
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent complaints */}
        {recentComplaints.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-sky-500" />
              Recently Filed Complaints
            </h2>
            <div className="grid gap-3">
              {recentComplaints.map((c) => (
                <a key={c.id} href={`/track/${c.ticket_id}`} className="group block">
                  <Card className="border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                            {c.ticket_id}
                          </span>
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <p className="mt-1.5 truncate text-sm text-muted-foreground">
                          {c.description}
                        </p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {c.category} • {c.department}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold', capitalize && 'capitalize')}>
        {value}
      </span>
    </div>
  );
}
