'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, UserPlus, RefreshCw, Star, ShieldCheck, Activity, Phone, Mail, Award, CheckCircle, Clock } from 'lucide-react';

const departments = [
  'Electricity Department',
  'Water Department',
  'Public Works Department',
  'Sanitation Department',
  'Health Department',
  'Police Department',
];

type Officer = {
  _id: string;
  name: string;
  employee_id: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  status: string;
  current_complaints?: number;
  overall_score?: number;
  performance?: {
    resolution_rate?: number;
    sla_compliance?: number;
    citizen_rating?: number;
  };
};

export default function OfficersDirectoryPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  // Register form state
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [designation, setDesignation] = useState('Field Officer');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState<Officer | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadOfficers() {
    setLoading(true);
    try {
      const res = await fetch('/api/officers');
      if (res.ok) {
        setOfficers(await res.json());
      } else {
        toast.error('Could not load officers.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Officer service is unreachable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOfficers();
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !employeeId || !email) {
      return toast.error('Please fill in Name, Employee ID, and Email.');
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          employee_id: employeeId,
          email,
          phone,
          department,
          designation,
          status: 'active',
        }),
      });
      if (!res.ok) throw new Error('Registration failed');
      toast.success('Officer registered successfully!');
      setName('');
      setEmployeeId('');
      setEmail('');
      setPhone('');
      setDepartment(departments[0]);
      setDesignation('Field Officer');
      loadOfficers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to register officer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/officers/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Officer record updated successfully!');
      setEditing(null);
      loadOfficers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update officer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-mesh py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Officer Directory & Registration
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add new field officers or manage the existing active roster profiles in one place.
            </p>
          </div>
          <Button variant="outline" onClick={loadOfficers} className="flex items-center gap-2 self-start md:self-auto">
            <RefreshCw className="h-4 w-4" /> Refresh Directory
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Registration Form Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Register New Officer</h2>
              </div>

              <form className="grid gap-4" onSubmit={handleRegister}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <Input value={name} onChange={e => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Priyesh Kumar" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</label>
                    <Input value={employeeId} onChange={e => setEmployeeId((e.target as HTMLInputElement).value)} placeholder="EMP-10293" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</label>
                    <Input value={designation} onChange={e => setDesignation((e.target as HTMLInputElement).value)} placeholder="Field Officer" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <Input value={email} type="email" onChange={e => setEmail((e.target as HTMLInputElement).value)} placeholder="name@dept.gov" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                    <Input value={phone} onChange={e => setPhone((e.target as HTMLInputElement).value)} placeholder="+91 9876543210" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Assignment</label>
                  <Select value={department} onValueChange={(v) => setDepartment(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full bg-violet-600 hover:bg-violet-700" disabled={submitting}>
                  {submitting ? 'Registering Officer...' : 'Add Officer to Roster'}
                </Button>
              </form>
            </div>
          </div>

          {/* Roster List Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Active Officer Roster</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {officers.length} Officer{officers.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading Roster...
                </div>
              ) : officers.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-muted-foreground">
                  <Users className="mb-2 h-10 w-10 opacity-40" />
                  <p className="font-medium">No officers found in directory</p>
                  <p className="text-xs">Add an officer using the registration form on the left.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {officers.map(o => (
                    <div key={o._id} className="group relative flex flex-col gap-4 rounded-xl border border-border/50 bg-white/50 p-5 transition-all hover:border-violet-500/30 hover:bg-white hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-lg">
                            {o.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 leading-snug">{o.name}</h3>
                              <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                {o.employee_id}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-violet-600 mt-0.5">{o.department}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{o.designation}</p>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditing(o)}>
                          Edit Info
                        </Button>
                      </div>

                      <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{o.email}</span>
                        </div>
                        {o.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{o.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Performance indicators */}
                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50/50 p-2.5 text-center text-[10px]">
                        <div>
                          <div className="font-bold text-slate-700">{o.performance?.resolution_rate ?? 0}%</div>
                          <div className="text-muted-foreground uppercase tracking-wider scale-90">Resolution</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-700">{o.performance?.sla_compliance ?? 0}%</div>
                          <div className="text-muted-foreground uppercase tracking-wider scale-90">SLA Compliance</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-700">{o.current_complaints ?? 0} active</div>
                          <div className="text-muted-foreground uppercase tracking-wider scale-90">Active Tasks</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Officer Modal Dialog */}
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <h2 className="text-lg font-bold text-slate-900">Update Officer Information</h2>
            </DialogHeader>
            {editing && (
              <div className="grid gap-4 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Officer Name</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: (e.target as HTMLInputElement).value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Employee ID</label>
                  <Input value={editing.employee_id} onChange={e => setEditing({ ...editing, employee_id: (e.target as HTMLInputElement).value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                  <Input value={editing.email} onChange={e => setEditing({ ...editing, email: (e.target as HTMLInputElement).value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                  <Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: (e.target as HTMLInputElement).value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
                  <Select value={editing.department || departments[0]} onValueChange={(v) => setEditing({ ...editing, department: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Designation</label>
                  <Input value={editing.designation || ''} onChange={e => setEditing({ ...editing, designation: (e.target as HTMLInputElement).value })} />
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? 'Saving changes...' : 'Save Officer Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
