// Frontend AI utilities — mirrors the backend engines for instant local feedback

export type SLARisk = 'OnTrack' | 'AtRisk' | 'HighRisk' | 'Overdue';

export interface SLAResult {
  risk: SLARisk;
  remainingHours: number;
  ageHours: number;
  slaHours: number;
  deadline: string;
  label: string;
  color: string;
  bg: string;
}

export interface OfficerScore {
  officerId: string;
  name: string;
  score: number;
  workload: number;
  skillMatch: number;
}

const SLA_HOURS: Record<string, number> = {
  Critical: 4,
  High: 24,
  Medium: 72,
  Low: 168,
};

const DEPT_AVG: Record<string, number> = {
  'Electricity Department': 6,
  'Water Department': 12,
  'Public Works Department': 36,
  'Sanitation Department': 18,
  'Health Department': 8,
  'Police Department': 10,
  'Revenue Department': 48,
  'General Administration': 24,
};

export function predictSLA(complaint: {
  priority: string;
  department: string;
  created_at: string;
}): SLAResult {
  const slaHours = SLA_HOURS[complaint.priority] || 72;
  const createdAt = new Date(complaint.created_at);
  const now = new Date();
  const ageHours = (now.getTime() - createdAt.getTime()) / 3600000;
  const remaining = slaHours - ageHours;
  const deptAvg = DEPT_AVG[complaint.department] || 24;
  const deadline = new Date(createdAt.getTime() + slaHours * 3600000).toISOString();

  let risk: SLARisk;
  if (remaining < 0) risk = 'Overdue';
  else if (remaining < deptAvg * 0.5) risk = 'HighRisk';
  else if (remaining < deptAvg * 1.5) risk = 'AtRisk';
  else risk = 'OnTrack';

  const meta = {
    OnTrack:  { label: 'On Track',  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    AtRisk:   { label: 'At Risk',   color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
    HighRisk: { label: 'High Risk', color: 'text-orange-500',  bg: 'bg-orange-500/10'  },
    Overdue:  { label: 'Overdue',   color: 'text-red-500',     bg: 'bg-red-500/10'     },
  }[risk];

  return { risk, remainingHours: Math.round(remaining * 10) / 10, ageHours: Math.round(ageHours * 10) / 10, slaHours, deadline, ...meta };
}

const PRIORITY_BASE: Record<string, number> = { Critical: 80, High: 60, Medium: 40, Low: 20 };
const SENTIMENT_BONUS: Record<string, number> = { urgent: 15, negative: 8, neutral: 0, positive: -5 };

export function calcPriorityScore(complaint: {
  priority: string;
  sentiment?: string;
  duplicate_count?: number;
  created_at: string;
  department: string;
}): number {
  const sla = predictSLA(complaint);
  const slaBonus = sla.risk === 'Overdue' ? 20 : sla.risk === 'HighRisk' ? 12 : sla.risk === 'AtRisk' ? 5 : 0;
  const dupBonus = Math.min((complaint.duplicate_count || 0) * 2, 10);
  const base = PRIORITY_BASE[complaint.priority] || 40;
  const sentiment = SENTIMENT_BONUS[complaint.sentiment || 'neutral'] || 0;
  return Math.min(100, base + sentiment + slaBonus + dupBonus);
}

export function getPriorityColor(score: number): { dot: string; bar: string } {
  if (score >= 80) return { dot: 'bg-red-500',    bar: 'bg-red-500'    };
  if (score >= 60) return { dot: 'bg-orange-500', bar: 'bg-orange-500' };
  if (score >= 40) return { dot: 'bg-amber-500',  bar: 'bg-amber-500'  };
  return              { dot: 'bg-blue-500',   bar: 'bg-blue-500'   };
}

export function getOverallOfficerScore(officer: {
  performance?: { resolution_rate?: number; sla_compliance?: number; citizen_rating?: number };
  readiness_score?: number;
}): number {
  const p = officer.performance || {};
  const rr = p.resolution_rate || 0;
  const sla = p.sla_compliance || 0;
  const rating = ((p.citizen_rating || 0) / 5) * 100;
  const readiness = officer.readiness_score || 0;
  return Math.round(rr * 0.3 + sla * 0.3 + rating * 0.2 + readiness * 0.2);
}

export function getSkillLevel(score: number): string {
  if (score >= 85) return 'Expert';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}
