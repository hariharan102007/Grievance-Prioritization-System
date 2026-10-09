import fs from 'fs';
import path from 'path';
import mongoose, { Schema, models } from 'mongoose';

export type ServerComplaint = {
  id: string;
  ticket_id: string;
  title: string | null;
  description: string;
  category: string | null;
  department: string | null;
  priority: string;
  status: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  language: string;
  sentiment: string;
  duplicate_of: string | null;
  duplicate_count: number;
  officer_remarks: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type ServerAuditLog = {
  id: string;
  complaint_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  remarks: string | null;
  created_at: string;
};

const SEED_COMPLAINTS: ServerComplaint[] = [
  {
    id: 'd10001aa-bbbb-cccc-dddd-eeeeffffff01',
    ticket_id: 'CMP10001',
    title: 'Water leakage near district hospital',
    description: 'Water leakage near the district hospital has been flooding the road for 3 days. Patients cannot reach the emergency ward.',
    category: 'Water Supply',
    department: 'Water Department',
    priority: 'Critical',
    status: 'Assigned',
    location: 'Near District Hospital, Sector 12',
    lat: 13.0827,
    lng: 80.2707,
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 4,
    photo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: 'Assigned to field team alpha. Pipeline pressure reduction in progress.'
  },
  {
    id: 'd10002aa-bbbb-cccc-dddd-eeeeffffff02',
    ticket_id: 'CMP10002',
    title: 'Pipe burst flooding hospital lane',
    description: 'Pipe burst near district hospital, water everywhere, ambulances stuck.',
    category: 'Water Supply',
    department: 'Water Department',
    priority: 'Critical',
    status: 'Assigned',
    location: 'District Hospital Road',
    lat: 13.0831,
    lng: 80.2711,
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: 'd10001aa-bbbb-cccc-dddd-eeeeffffff01',
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1542013936693-8848e574047a?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10003aa-bbbb-cccc-dddd-eeeeffffff03',
    ticket_id: 'CMP10003',
    title: 'Live electric wire near school gate',
    description: 'Live electric wire hanging near the school gate. Children are at risk of electrocution. Please fix immediately.',
    category: 'Electricity',
    department: 'Electricity Department',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Government School, Sector 7',
    lat: 13.0789,
    lng: 80.2654,
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 2,
    photo_url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: 'Line disconnected for safety. Replacement crew en-route.'
  },
  {
    id: 'd10004aa-bbbb-cccc-dddd-eeeeffffff04',
    ticket_id: 'CMP10004',
    title: 'Garbage dump accumulation',
    description: 'Garbage not collected for 5 days in our area. Foul smell and mosquitoes everywhere.',
    category: 'Sanitation',
    department: 'Sanitation Department',
    priority: 'High',
    status: 'Registered',
    location: 'Gandhi Nagar, Ward 4',
    lat: 13.0655,
    lng: 80.2455,
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 1,
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10005aa-bbbb-cccc-dddd-eeeeffffff05',
    ticket_id: 'CMP10005',
    title: 'Deep pothole causing vehicle accidents',
    description: 'Large pothole on MG Road caused a bike accident last night. Needs urgent repair.',
    category: 'Roads',
    department: 'Public Works Department',
    priority: 'High',
    status: 'Assigned',
    location: 'MG Road, near Signal 5',
    lat: 13.0911,
    lng: 80.2812,
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: 'Asphalt patching squad scheduled for early morning hours.'
  },
  {
    id: 'd10006aa-bbbb-cccc-dddd-eeeeffffff06',
    ticket_id: 'CMP10006',
    title: 'Streetlight outage',
    description: 'Streetlight not working on Lane 3 for a week. Unsafe at night.',
    category: 'Electricity',
    department: 'Electricity Department',
    priority: 'Medium',
    status: 'Registered',
    location: 'Lane 3, Anna Nagar',
    lat: 13.0855,
    lng: 80.2104,
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10007aa-bbbb-cccc-dddd-eeeeffffff07',
    ticket_id: 'CMP10007',
    title: 'OPD clinic delay and staff behavior',
    description: 'Hospital staff rude and made us wait 4 hours for a checkup.',
    category: 'Healthcare',
    department: 'Health Department',
    priority: 'Medium',
    status: 'In Progress',
    location: 'City Hospital, OPD',
    lat: 13.0722,
    lng: 80.2511,
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1538108149393-fdfd812903b8?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: 'Superintendent notified. Investigating shift roster.'
  }
];

const SEED_AUDIT_LOGS: ServerAuditLog[] = [
  {
    id: 'log-1',
    complaint_id: 'd10001aa-bbbb-cccc-dddd-eeeeffffff01',
    action: 'Status updated to Assigned',
    from_status: 'Registered',
    to_status: 'Assigned',
    remarks: 'Auto-assigned to Water Department based on category analysis.',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 600000).toISOString()
  },
  {
    id: 'log-2',
    complaint_id: 'd10003aa-bbbb-cccc-dddd-eeeeffffff03',
    action: 'Status updated to In Progress',
    from_status: 'Assigned',
    to_status: 'In Progress',
    remarks: 'Emergency response team dispatched to secure the school gate.',
    created_at: new Date(Date.now() - 5 * 3600 * 1000 + 1200000).toISOString()
  }
];

// Server-side storage singleton
interface GrievanceStore {
  complaints: ServerComplaint[];
  auditLogs: ServerAuditLog[];
  initialized: boolean;
}

const globalGrievance = globalThis as typeof globalThis & {
  __grievanceStore?: GrievanceStore;
};

function getStorageFilePath(): string {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'complaints_database.json');
  } catch {
    return path.join('/tmp', 'grievance_complaints_db.json');
  }
}

function loadFromDisk(): { complaints: ServerComplaint[]; auditLogs: ServerAuditLog[] } | null {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.complaints) && parsed.complaints.length > 0) {
        return {
          complaints: parsed.complaints,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : SEED_AUDIT_LOGS
        };
      }
    }
  } catch (err) {
    console.warn('[ServerDB disk read warn]:', err);
  }
  return null;
}

function saveToDisk(complaints: ServerComplaint[], auditLogs: ServerAuditLog[]) {
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify({ complaints, auditLogs }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ServerDB disk save warn]:', err);
  }
}

export function getDatabase(): GrievanceStore {
  if (!globalGrievance.__grievanceStore) {
    const diskData = loadFromDisk();
    globalGrievance.__grievanceStore = {
      complaints: diskData ? diskData.complaints : [...SEED_COMPLAINTS],
      auditLogs: diskData ? diskData.auditLogs : [...SEED_AUDIT_LOGS],
      initialized: true,
    };
  }
  return globalGrievance.__grievanceStore;
}

export async function listComplaints(filters?: {
  ticket_id?: string;
  department?: string;
  status?: string;
  category?: string;
  search?: string;
  order?: string;
  ascending?: boolean;
  limit?: number;
}): Promise<ServerComplaint[]> {
  const db = getDatabase();
  let list = [...db.complaints];

  if (filters?.ticket_id) {
    const tid = filters.ticket_id.toUpperCase().trim();
    list = list.filter((c) => c.ticket_id.toUpperCase() === tid);
  }

  if (filters?.department && filters.department !== 'all') {
    list = list.filter(
      (c) => (c.department || '').toLowerCase() === filters.department!.toLowerCase()
    );
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((c) => c.status === filters.status);
  }

  if (filters?.category && filters.category !== 'all') {
    list = list.filter(
      (c) => (c.category || '').toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.ticket_id.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.department || '').toLowerCase().includes(q)
    );
  }

  // Ordering
  const orderField = (filters?.order || 'created_at') as keyof ServerComplaint;
  const asc = filters?.ascending ?? false;

  list.sort((a, b) => {
    const valA = a[orderField] ?? '';
    const valB = b[orderField] ?? '';
    if (valA === valB) return 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return asc ? (valA > valB ? 1 : -1) : (valA > valB ? -1 : 1);
  });

  if (filters?.limit && filters.limit > 0) {
    list = list.slice(0, filters.limit);
  }

  return list;
}

export async function findComplaintByTicketOrId(identifier: string): Promise<ServerComplaint | null> {
  const db = getDatabase();
  const clean = identifier.trim().toUpperCase();
  const found = db.complaints.find(
    (c) => c.ticket_id.toUpperCase() === clean || c.id === identifier
  );
  return found || null;
}

export async function insertComplaint(payload: Partial<ServerComplaint>): Promise<ServerComplaint> {
  const db = getDatabase();

  // Generate unique Ticket ID if missing
  let ticketId = payload.ticket_id;
  if (!ticketId) {
    let candidate = '';
    do {
      candidate = 'CMP' + Math.floor(10000 + Math.random() * 89999);
    } while (db.complaints.some((c) => c.ticket_id === candidate));
    ticketId = candidate;
  } else {
    ticketId = ticketId.toUpperCase();
  }

  const id = payload.id || 'cmp_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const now = new Date().toISOString();

  const newComplaint: ServerComplaint = {
    id,
    ticket_id: ticketId,
    title: payload.title || payload.description?.slice(0, 60) || 'Citizen Grievance',
    description: payload.description || '',
    category: payload.category || 'General',
    department: payload.department || 'Public Works Department',
    priority: payload.priority || 'Medium',
    status: payload.status || 'Registered',
    location: payload.location || 'Municipal Area',
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    language: payload.language || 'English',
    sentiment: payload.sentiment || 'neutral',
    duplicate_of: payload.duplicate_of || null,
    duplicate_count: payload.duplicate_count || 0,
    officer_remarks: payload.officer_remarks || null,
    photo_url: payload.photo_url || null,
    created_at: payload.created_at || now,
    updated_at: now,
    resolved_at: payload.resolved_at || null,
  };

  db.complaints.unshift(newComplaint);

  // Auto-record initial audit log
  const initialLog: ServerAuditLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 11),
    complaint_id: newComplaint.id,
    action: `Complaint registered with Ticket ID ${newComplaint.ticket_id}`,
    from_status: null,
    to_status: newComplaint.status,
    remarks: 'Citizen grievance submitted and logged to portal registry.',
    created_at: now,
  };
  db.auditLogs.unshift(initialLog);

  // Save to disk
  saveToDisk(db.complaints, db.auditLogs);

  return newComplaint;
}

export async function updateComplaintById(
  idOrTicket: string,
  updates: Partial<ServerComplaint>
): Promise<ServerComplaint | null> {
  const db = getDatabase();
  const clean = idOrTicket.trim().toUpperCase();
  const index = db.complaints.findIndex(
    (c) => c.id === idOrTicket || c.ticket_id.toUpperCase() === clean
  );

  if (index === -1) return null;

  const current = db.complaints[index];
  const oldStatus = current.status;
  const now = new Date().toISOString();

  const updated: ServerComplaint = {
    ...current,
    ...updates,
    updated_at: now,
    resolved_at:
      updates.status === 'Resolved' && !current.resolved_at
        ? now
        : updates.status && updates.status !== 'Resolved'
        ? null
        : (updates.resolved_at !== undefined ? updates.resolved_at : current.resolved_at),
  };

  db.complaints[index] = updated;

  // Add audit log if status or remarks changed
  if (updates.status && updates.status !== oldStatus) {
    db.auditLogs.push({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      complaint_id: updated.id,
      action: `Status updated to ${updates.status}`,
      from_status: oldStatus,
      to_status: updates.status,
      remarks: updates.officer_remarks || `Status transitioned from ${oldStatus} to ${updates.status}`,
      created_at: now,
    });
  } else if (updates.officer_remarks && updates.officer_remarks !== current.officer_remarks) {
    db.auditLogs.push({
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      complaint_id: updated.id,
      action: 'Officer remarks updated',
      from_status: current.status,
      to_status: current.status,
      remarks: updates.officer_remarks,
      created_at: now,
    });
  }

  saveToDisk(db.complaints, db.auditLogs);
  return updated;
}

export async function getAuditLogsForComplaint(complaintId: string): Promise<ServerAuditLog[]> {
  const db = getDatabase();
  return db.auditLogs.filter((log) => log.complaint_id === complaintId);
}
