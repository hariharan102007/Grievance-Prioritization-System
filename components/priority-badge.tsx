import { cn } from '@/lib/utils';
import { PRIORITY_COLORS } from '@/lib/supabase';

export function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || 'bg-slate-500';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white',
        color
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      {priority}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Registered: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Registered'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        style
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
