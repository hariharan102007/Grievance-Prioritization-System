'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, ShieldCheck, MapPin, Zap, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const departments = [
  'Electricity Department',
  'Water Department',
  'Public Works Department',
  'Sanitation Department',
  'Health Department',
  'Police Department',
];

export default function OfficerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [designation, setDesignation] = useState('Field Officer');
  const [assignedArea, setAssignedArea] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !employeeId || !email || !department) {
      toast.error('Please complete all required officer fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          employee_id: employeeId,
          email,
          phone,
          department,
          designation,
          assigned_area: assignedArea,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to register officer.');
      }

      toast.success('Officer registered successfully. Verification pending.');
      router.push('/officer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to register officer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-border/70 bg-white/90 px-8 py-10 shadow-xl shadow-slate-900/5">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-500">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Register New Officer</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a new officer to the AI-assisted management system with verification and department assignment.
              </p>
            </div>
          </div>

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Officer Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee ID</label>
                <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-12345" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation</label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Field Officer" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Area</label>
              <Input value={assignedArea} onChange={(e) => setAssignedArea(e.target.value)} placeholder="Ward 12 / Sector A" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Verification-ready registration
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  New officers are registered in pending status until employee ID and documents are verified.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  Location-aware assignments
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Assigned area and department data help the AI match complaints with the right officer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? 'Registering...' : 'Register Officer'}
              </Button>
              <span className="text-sm text-muted-foreground">The officer will appear in the roster after verification.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
