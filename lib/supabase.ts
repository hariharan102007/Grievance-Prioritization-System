import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const SEED_DEPARTMENTS = [
  { id: 'dep-1', name: 'Water Department', category: 'Water Supply', description: 'Handles water supply, leakage, and pipeline issues' },
  { id: 'dep-2', name: 'Electricity Department', category: 'Electricity', description: 'Handles power outages, wiring, and streetlight issues' },
  { id: 'dep-3', name: 'Public Works Department', category: 'Roads', description: 'Handles road repair, potholes, and infrastructure' },
  { id: 'dep-4', name: 'Sanitation Department', category: 'Sanitation', description: 'Handles garbage collection, waste, and cleanliness' },
  { id: 'dep-5', name: 'Health Department', category: 'Healthcare', description: 'Handles public health, hospitals, and sanitation hazards' },
  { id: 'dep-6', name: 'Police Department', category: 'Public Safety', description: 'Handles crime, safety, and law enforcement' }
];

const SEED_COMPLAINTS = [
  {
    id: 'd10001aa-bbbb-cccc-dddd-eeeeffffff01',
    ticket_id: 'CMP10001',
    description: 'Water leakage near the district hospital has been flooding the road for 3 days. Patients cannot reach the emergency ward.',
    category: 'Water Supply',
    department: 'Water Department',
    priority: 'Critical',
    status: 'Assigned',
    location: 'Near District Hospital, Sector 12',
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 4,
    photo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10002aa-bbbb-cccc-dddd-eeeeffffff02',
    ticket_id: 'CMP10002',
    description: 'Pipe burst near district hospital, water everywhere, ambulances stuck.',
    category: 'Water Supply',
    department: 'Water Department',
    priority: 'Critical',
    status: 'Assigned',
    location: 'District Hospital Road',
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
    description: 'Live electric wire hanging near the school gate. Children are at risk of electrocution. Please fix immediately.',
    category: 'Electricity',
    department: 'Electricity Department',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Government School, Sector 7',
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 2,
    photo_url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10004aa-bbbb-cccc-dddd-eeeeffffff04',
    ticket_id: 'CMP10004',
    description: 'Garbage not collected for 5 days in our area. Foul smell and mosquitoes everywhere.',
    category: 'Sanitation',
    department: 'Sanitation Department',
    priority: 'High',
    status: 'Registered',
    location: 'Gandhi Nagar, Ward 4',
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
    description: 'Large pothole on MG Road caused a bike accident last night. Needs urgent repair.',
    category: 'Roads',
    department: 'Public Works Department',
    priority: 'High',
    status: 'Assigned',
    location: 'MG Road, near Signal 5',
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10006aa-bbbb-cccc-dddd-eeeeffffff06',
    ticket_id: 'CMP10006',
    description: 'Streetlight not working on Lane 3 for a week. Unsafe at night.',
    category: 'Electricity',
    department: 'Electricity Department',
    priority: 'Medium',
    status: 'Registered',
    location: 'Lane 3, Anna Nagar',
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
    description: 'Hospital staff rude and made us wait 4 hours for a checkup.',
    category: 'Healthcare',
    department: 'Health Department',
    priority: 'Medium',
    status: 'In Progress',
    location: 'City Hospital, OPD',
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1538108149393-fdfd812903b8?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10008aa-bbbb-cccc-dddd-eeeeffffff08',
    ticket_id: 'CMP10008',
    description: 'Bus stop shelter broken, no seating for elderly passengers.',
    category: 'Transport',
    department: 'Public Works Department',
    priority: 'Low',
    status: 'Resolved',
    location: 'Bus Stop, Main Road',
    language: 'English',
    sentiment: 'neutral',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1464219222984-216ebffaaf85?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    officer_remarks: 'Repaired the shelter and installed new bench.'
  },
  {
    id: 'd10009aa-bbbb-cccc-dddd-eeeeffffff09',
    ticket_id: 'CMP10009',
    description: 'Stray dogs causing nuisance near the park. Children afraid to play.',
    category: 'Public Safety',
    department: 'Police Department',
    priority: 'Medium',
    status: 'Resolved',
    location: 'Central Park, Sector 3',
    language: 'English',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    officer_remarks: 'Municipal dog squad relocated the stray dogs to a shelter.'
  },
  {
    id: 'd10010aa-bbbb-cccc-dddd-eeeeffffff10',
    ticket_id: 'CMP10010',
    description: 'Drainage overflow on 5th street. Dirty water entering homes.',
    category: 'Sanitation',
    department: 'Sanitation Department',
    priority: 'High',
    status: 'In Progress',
    location: '5th Street, Lakshmi Nagar',
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 3,
    photo_url: 'https://images.unsplash.com/photo-1500333186434-7b646d53b006?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10011aa-bbbb-cccc-dddd-eeeeffffff11',
    ticket_id: 'CMP10011',
    description: 'No water supply in our area for 2 days. Please help.',
    category: 'Water Supply',
    department: 'Water Department',
    priority: 'High',
    status: 'Registered',
    location: 'Shastri Nagar, Block A',
    language: 'Hindi',
    sentiment: 'negative',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  },
  {
    id: 'd10012aa-bbbb-cccc-dddd-eeeeffffff12',
    ticket_id: 'CMP10012',
    description: 'Traffic signal not working at the main junction. Accidents happening.',
    category: 'Public Safety',
    department: 'Police Department',
    priority: 'Critical',
    status: 'Assigned',
    location: 'Main Junction, City Center',
    language: 'English',
    sentiment: 'urgent',
    duplicate_of: null,
    duplicate_count: 0,
    photo_url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    resolved_at: null,
    officer_remarks: null
  }
];

const SEED_AUDIT_LOGS = [
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

class MockQueryBuilder {
  private tableName: string;
  private filters: { field: string; value: any }[] = [];
  private pendingUpdates: any = null;
  private orderField: string | null = null;
  private orderAscending = true;
  private limitVal: number | null = null;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string) {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private getStore() {
    if (typeof window === 'undefined') return [];
    
    const needsComplaintsUpdate = this.tableName === 'complaints' && !localStorage.getItem('mock_complaints_v2');
    if (!localStorage.getItem(`mock_${this.tableName}`) || needsComplaintsUpdate) {
      let initialData: any[] = [];
      if (this.tableName === 'departments') {
        initialData = SEED_DEPARTMENTS;
      } else if (this.tableName === 'complaints') {
        initialData = SEED_COMPLAINTS;
        localStorage.setItem('mock_complaints_v2', 'true');
      } else if (this.tableName === 'audit_logs') {
        initialData = SEED_AUDIT_LOGS;
      }
      localStorage.setItem(`mock_${this.tableName}`, JSON.stringify(initialData));
    }
    return JSON.parse(localStorage.getItem(`mock_${this.tableName}`) || '[]');
  }

  private setStore(data: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_${this.tableName}`, JSON.stringify(data));
    }
  }

  async insert(payload: any) {
    const records = Array.isArray(payload) ? payload : [payload];
    
    // 1. If complaints table, sync to real backend database API
    if (this.tableName === 'complaints' && typeof window !== 'undefined') {
      try {
        const results = await Promise.all(
          records.map(async (r) => {
            const res = await fetch('/api/complaints', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(r),
            });
            if (res.ok) {
              return await res.json();
            }
            return null;
          })
        );
        const validResults = results.filter(Boolean);
        if (validResults.length > 0) {
          // Cache in local store
          const currentStore = this.getStore();
          this.setStore([...currentStore, ...validResults]);
          return { data: Array.isArray(payload) ? validResults : validResults[0], error: null };
        }
      } catch (networkErr) {
        console.warn('[Offline fallback for insert]:', networkErr);
      }
    }

    const data = this.getStore();
    const newRecords = records.map((r) => {
      const record = {
        id: r.id || 'cmp_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r,
      };
      if (this.tableName === 'complaints') {
        if (!record.ticket_id) {
          record.ticket_id = 'CMP' + Math.floor(10000 + Math.random() * 89999);
        }
      }
      return record;
    });

    const updatedData = [...data, ...newRecords];
    this.setStore(updatedData);

    return { data: Array.isArray(payload) ? newRecords : newRecords[0], error: null };
  }

  update(updates: any) {
    this.pendingUpdates = updates;
    return this;
  }

  async delete() {
    const data = this.getStore();
    const updatedData = data.filter((item: any) => {
      return !this.filters.every((f) => item[f.field] === f.value);
    });
    this.setStore(updatedData);
    return { data: null, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    // If there are pending updates, apply to backend database API
    if (this.pendingUpdates !== null) {
      if (this.tableName === 'complaints' && typeof window !== 'undefined') {
        const idFilter = this.filters.find((f) => f.field === 'id' || f.field === 'ticket_id');
        if (idFilter) {
          try {
            const res = await fetch(`/api/complaints/${encodeURIComponent(idFilter.value)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.pendingUpdates),
            });
            if (res.ok) {
              const updatedDoc = await res.json();
              // Update local store cache
              const store = this.getStore();
              const newStore = store.map((item: any) =>
                item.id === updatedDoc.id || item.ticket_id === updatedDoc.ticket_id ? updatedDoc : item
              );
              this.setStore(newStore);
              this.pendingUpdates = null;
              return { data: this.isMaybeSingle ? updatedDoc : [updatedDoc], error: null };
            }
          } catch (patchErr) {
            console.warn('[Offline fallback for update]:', patchErr);
          }
        }
      }

      const store = this.getStore();
      const updatedData = store.map((item: any) => {
        const matches = this.filters.every((f) => {
          if (f.field === 'ticket_id' && typeof f.value === 'string') {
            return (item[f.field] || '').toUpperCase() === f.value.toUpperCase();
          }
          return item[f.field] === f.value;
        });
        if (matches) {
          return {
            ...item,
            ...this.pendingUpdates,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      });

      this.setStore(updatedData);

      const updatedItems = updatedData.filter((item: any) =>
        this.filters.every((f) => {
          if (f.field === 'ticket_id' && typeof f.value === 'string') {
            return (item[f.field] || '').toUpperCase() === f.value.toUpperCase();
          }
          return item[f.field] === f.value;
        })
      );

      const result = this.isMaybeSingle ? (updatedItems.length > 0 ? updatedItems[0] : null) : updatedItems;
      this.pendingUpdates = null;
      return { data: result, error: null };
    }

    // SELECT QUERY
    // 1. Try real backend database API first for complaints and audit_logs
    if (typeof window !== 'undefined') {
      if (this.tableName === 'complaints') {
        try {
          const params = new URLSearchParams();
          for (const f of this.filters) {
            if (f.field === 'ticket_id') params.append('ticket_id', String(f.value));
            if (f.field === 'department') params.append('department', String(f.value));
            if (f.field === 'status') params.append('status', String(f.value));
            if (f.field === 'category') params.append('category', String(f.value));
          }
          if (this.orderField) {
            params.append('order', this.orderField);
            params.append('ascending', String(this.orderAscending));
          }
          if (this.limitVal !== null) {
            params.append('limit', String(this.limitVal));
          }

          const res = await fetch(`/api/complaints?${params.toString()}`);
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData)) {
              if (this.isMaybeSingle) {
                return { data: apiData.length > 0 ? apiData[0] : null, error: null };
              }
              return { data: apiData, error: null };
            }
          }
        } catch (apiErr) {
          console.warn('[Falling back to local cache for complaints]:', apiErr);
        }
      } else if (this.tableName === 'audit_logs') {
        const complaintIdFilter = this.filters.find((f) => f.field === 'complaint_id');
        if (complaintIdFilter) {
          try {
            const res = await fetch(
              `/api/audit-logs?complaint_id=${encodeURIComponent(complaintIdFilter.value)}`
            );
            if (res.ok) {
              const logs = await res.json();
              if (Array.isArray(logs)) {
                return { data: logs, error: null };
              }
            }
          } catch (logErr) {
            console.warn('[Falling back to local cache for audit logs]:', logErr);
          }
        }
      }
    }

    // Fallback to local storage store
    let data = this.getStore();

    if (this.filters.length > 0) {
      data = data.filter((item: any) => {
        return this.filters.every((f) => {
          if (f.field === 'ticket_id' && typeof f.value === 'string') {
            return (item[f.field] || '').toUpperCase() === f.value.toUpperCase();
          }
          return item[f.field] === f.value;
        });
      });
    }

    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAscending;
      data.sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'string') {
          return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return asc ? valA - valB : valB - valA;
      });
    }

    if (this.limitVal !== null) {
      data = data.slice(0, this.limitVal);
    }

    if (this.isMaybeSingle) {
      return { data: data.length > 0 ? data[0] : null, error: null };
    }

    return { data, error: null };
  }
}

const customAuth = {
  signInWithOtp: async (params: { email?: string; phone?: string }) => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { data: null, error: new Error(data.error || 'Unable to send OTP.') };
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err || new Error('Network error while sending OTP.') };
    }
  },
  verifyOtp: async (params: { email?: string; phone?: string; token: string }) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { data: null, error: new Error(data.error || 'Invalid OTP code.') };
      }
      return {
        data: {
          user: data.user,
          session: { user: data.user, access_token: 'valid-session-token' },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err || new Error('Network error while verifying OTP.') };
    }
  },
  signOut: async () => ({ error: null }),
};

export const realSupabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

class HybridQueryBuilder {
  private tableName: string;
  private realBuilder: any;
  private mockBuilder: MockQueryBuilder;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.realBuilder = realSupabase ? realSupabase.from(tableName) : null;
    this.mockBuilder = new MockQueryBuilder(tableName);
  }

  select(fields?: string) {
    if (this.realBuilder) this.realBuilder = this.realBuilder.select(fields);
    this.mockBuilder.select(fields);
    return this;
  }

  eq(field: string, value: any) {
    if (this.realBuilder) this.realBuilder = this.realBuilder.eq(field, value);
    this.mockBuilder.eq(field, value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    if (this.realBuilder) this.realBuilder = this.realBuilder.order(field, options);
    this.mockBuilder.order(field, options);
    return this;
  }

  limit(val: number) {
    if (this.realBuilder) this.realBuilder = this.realBuilder.limit(val);
    this.mockBuilder.limit(val);
    return this;
  }

  maybeSingle() {
    if (this.realBuilder) this.realBuilder = this.realBuilder.maybeSingle();
    this.mockBuilder.maybeSingle();
    return this;
  }

  async insert(payload: any) {
    if (this.realBuilder) {
      try {
        const res = await this.realBuilder.insert(payload);
        if (!res.error) {
          // Also sync to mock store so local views immediately have it
          await this.mockBuilder.insert(payload);
          return res;
        }
      } catch (err) {
        console.warn(`[Supabase insert fallback for ${this.tableName}]:`, err);
      }
    }
    return this.mockBuilder.insert(payload);
  }

  update(updates: any) {
    if (this.realBuilder) this.realBuilder = this.realBuilder.update(updates);
    this.mockBuilder.update(updates);
    return this;
  }

  async delete() {
    if (this.realBuilder) {
      try {
        const res = await this.realBuilder.delete();
        if (!res.error) return res;
      } catch {}
    }
    return this.mockBuilder.delete();
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    if (this.realBuilder) {
      try {
        const res = await this.realBuilder;
        if (!res.error && res.data !== null && (Array.isArray(res.data) ? res.data.length > 0 : true)) {
          return res;
        }
      } catch (err) {
        console.warn(`[Supabase execute fallback for ${this.tableName}]:`, err);
      }
    }
    return this.mockBuilder.execute();
  }
}

export const supabase = {
  auth: customAuth,
  from(tableName: string) {
    return new HybridQueryBuilder(tableName);
  },
};


export type Complaint = {
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

export type Department = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  complaint_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  remarks: string | null;
  created_at: string;
};

export const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const STATUS_FLOW = [
  'Registered',
  'Assigned',
  'In Progress',
  'Resolved',
] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
};

export const STATUS_COLORS: Record<string, string> = {
  Registered: 'bg-slate-500',
  Assigned: 'bg-indigo-500',
  'In Progress': 'bg-amber-500',
  Resolved: 'bg-emerald-500',
};
