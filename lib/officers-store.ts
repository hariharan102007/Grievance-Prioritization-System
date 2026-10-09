export interface OfficerData {
  _id: string;
  name: string;
  employee_id: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  assigned_area?: string;
  assigned_categories?: string[];
  role?: string;
  status: string;
  skills?: Record<string, number>;
  performance?: {
    resolution_rate?: number;
    sla_compliance?: number;
    citizen_rating?: number;
    avg_resolution_hrs?: number;
    reopened_count?: number;
    critical_resolved?: number;
    total_resolved?: number;
  };
  readiness_score?: number;
  overall_score?: number;
  current_complaints?: number;
  location?: { lat: number; lng: number };
  createdAt?: string;
  updatedAt?: string;
}

const INITIAL_OFFICERS: OfficerData[] = [
  {
    _id: 'off-001',
    name: 'Arjun Kumar',
    employee_id: 'EMP001',
    email: 'arjun.kumar@dsa.gov',
    phone: '9876543210',
    designation: 'Senior Supervisor',
    department: 'Electricity Department',
    assigned_area: 'North Chennai',
    assigned_categories: ['Electricity', 'Street Light'],
    role: 'Supervisor',
    status: 'active',
    skills: {
      'Water Supply': 30,
      Electricity: 95,
      Roads: 45,
      Sanitation: 20,
      Healthcare: 25,
      'Public Safety': 40,
      Transport: 35,
      Environment: 30,
    },
    performance: {
      resolution_rate: 94,
      sla_compliance: 91,
      citizen_rating: 4.7,
      avg_resolution_hrs: 4.2,
      reopened_count: 2,
      critical_resolved: 18,
      total_resolved: 120,
    },
    readiness_score: 96,
    overall_score: 92,
    current_complaints: 2,
    location: { lat: 13.0827, lng: 80.2707 },
  },
  {
    _id: 'off-002',
    name: 'Priya Sharma',
    employee_id: 'EMP002',
    email: 'priya.sharma@dsa.gov',
    phone: '9876543211',
    designation: 'Field Officer',
    department: 'Water Department',
    assigned_area: 'South Chennai',
    assigned_categories: ['Water Supply', 'Drainage'],
    role: 'Officer',
    status: 'active',
    skills: {
      'Water Supply': 88,
      Electricity: 20,
      Roads: 30,
      Sanitation: 60,
      Healthcare: 15,
      'Public Safety': 10,
      Transport: 25,
      Environment: 50,
    },
    performance: {
      resolution_rate: 87,
      sla_compliance: 83,
      citizen_rating: 4.4,
      avg_resolution_hrs: 8.1,
      reopened_count: 4,
      critical_resolved: 10,
      total_resolved: 95,
    },
    readiness_score: 89,
    overall_score: 85,
    current_complaints: 3,
    location: { lat: 12.9716, lng: 80.2437 },
  },
  {
    _id: 'off-003',
    name: 'Ravi Selvam',
    employee_id: 'EMP003',
    email: 'ravi.selvam@dsa.gov',
    phone: '9876543212',
    designation: 'Field Officer',
    department: 'Public Works Department',
    assigned_area: 'Central Chennai',
    assigned_categories: ['Roads', 'Potholes'],
    role: 'Officer',
    status: 'active',
    skills: {
      'Water Supply': 40,
      Electricity: 35,
      Roads: 92,
      Sanitation: 30,
      Healthcare: 20,
      'Public Safety': 25,
      Transport: 80,
      Environment: 30,
    },
    performance: {
      resolution_rate: 78,
      sla_compliance: 75,
      citizen_rating: 4.1,
      avg_resolution_hrs: 18.5,
      reopened_count: 6,
      critical_resolved: 8,
      total_resolved: 72,
    },
    readiness_score: 81,
    overall_score: 77,
    current_complaints: 1,
    location: { lat: 13.06, lng: 80.25 },
  },
  {
    _id: 'off-004',
    name: 'Meena Devi',
    employee_id: 'EMP004',
    email: 'meena.devi@dsa.gov',
    phone: '9876543213',
    designation: 'Senior Officer',
    department: 'Sanitation Department',
    assigned_area: 'West Chennai',
    assigned_categories: ['Sanitation', 'Garbage', 'Waste'],
    role: 'Supervisor',
    status: 'active',
    skills: {
      'Water Supply': 50,
      Electricity: 15,
      Roads: 20,
      Sanitation: 90,
      Healthcare: 45,
      'Public Safety': 20,
      Transport: 15,
      Environment: 72,
    },
    performance: {
      resolution_rate: 91,
      sla_compliance: 88,
      citizen_rating: 4.5,
      avg_resolution_hrs: 10.3,
      reopened_count: 3,
      critical_resolved: 14,
      total_resolved: 108,
    },
    readiness_score: 93,
    overall_score: 89,
    current_complaints: 2,
    location: { lat: 13.05, lng: 80.21 },
  },
  {
    _id: 'off-005',
    name: 'Suresh Babu',
    employee_id: 'EMP005',
    email: 'suresh.babu@dsa.gov',
    phone: '9876543214',
    designation: 'Field Officer',
    department: 'Health Department',
    assigned_area: 'East Chennai',
    assigned_categories: ['Healthcare', 'Hospital'],
    role: 'Officer',
    status: 'active',
    skills: {
      'Water Supply': 25,
      Electricity: 20,
      Roads: 15,
      Sanitation: 55,
      Healthcare: 85,
      'Public Safety': 30,
      Transport: 20,
      Environment: 40,
    },
    performance: {
      resolution_rate: 82,
      sla_compliance: 79,
      citizen_rating: 4.2,
      avg_resolution_hrs: 6.7,
      reopened_count: 5,
      critical_resolved: 12,
      total_resolved: 83,
    },
    readiness_score: 85,
    overall_score: 80,
    current_complaints: 1,
    location: { lat: 13.09, lng: 80.29 },
  },
  {
    _id: 'off-006',
    name: 'Kavitha Nair',
    employee_id: 'EMP006',
    email: 'kavitha.nair@dsa.gov',
    phone: '9876543215',
    designation: 'Inspector',
    department: 'Police Department',
    assigned_area: 'T Nagar',
    assigned_categories: ['Public Safety', 'Crime', 'Traffic'],
    role: 'Officer',
    status: 'active',
    skills: {
      'Water Supply': 10,
      Electricity: 15,
      Roads: 30,
      Sanitation: 10,
      Healthcare: 20,
      'Public Safety': 95,
      Transport: 70,
      Environment: 15,
    },
    performance: {
      resolution_rate: 96,
      sla_compliance: 94,
      citizen_rating: 4.8,
      avg_resolution_hrs: 3.5,
      reopened_count: 1,
      critical_resolved: 22,
      total_resolved: 135,
    },
    readiness_score: 97,
    overall_score: 95,
    current_complaints: 2,
    location: { lat: 13.04, lng: 80.2342 },
  },
  {
    _id: 'off-007',
    name: 'Dinesh Raj',
    employee_id: 'EMP007',
    email: 'dinesh.raj@dsa.gov',
    phone: '9876543216',
    designation: 'Revenue Officer',
    department: 'Revenue Department',
    assigned_area: 'Tambaram',
    assigned_categories: ['Transport', 'Land', 'Tax'],
    role: 'Supervisor',
    status: 'leave',
    skills: {
      'Water Supply': 15,
      Electricity: 20,
      Roads: 25,
      Sanitation: 15,
      Healthcare: 10,
      'Public Safety': 15,
      Transport: 88,
      Environment: 20,
    },
    performance: {
      resolution_rate: 73,
      sla_compliance: 70,
      citizen_rating: 3.9,
      avg_resolution_hrs: 32.0,
      reopened_count: 8,
      critical_resolved: 5,
      total_resolved: 58,
    },
    readiness_score: 76,
    overall_score: 71,
    current_complaints: 0,
    location: { lat: 12.9249, lng: 80.1 },
  },
  {
    _id: 'off-008',
    name: 'Anitha Raj',
    employee_id: 'EMP008',
    email: 'anitha.raj@dsa.gov',
    phone: '9876543217',
    designation: 'Junior Officer',
    department: 'Water Department',
    assigned_area: 'Adyar',
    assigned_categories: ['Water Supply', 'Sewage'],
    role: 'Officer',
    status: 'active',
    skills: {
      'Water Supply': 72,
      Electricity: 15,
      Roads: 20,
      Sanitation: 48,
      Healthcare: 12,
      'Public Safety': 8,
      Transport: 18,
      Environment: 40,
    },
    performance: {
      resolution_rate: 70,
      sla_compliance: 68,
      citizen_rating: 3.8,
      avg_resolution_hrs: 14.0,
      reopened_count: 9,
      critical_resolved: 4,
      total_resolved: 48,
    },
    readiness_score: 74,
    overall_score: 69,
    current_complaints: 1,
    location: { lat: 13.0067, lng: 80.2606 },
  },
];

const globalOfficers = globalThis as typeof globalThis & {
  __officersStore?: OfficerData[];
};

export function getOfficers(): OfficerData[] {
  if (!globalOfficers.__officersStore) {
    globalOfficers.__officersStore = [...INITIAL_OFFICERS];
  }
  return globalOfficers.__officersStore;
}

export function getOfficerById(id: string): OfficerData | undefined {
  const officers = getOfficers();
  return officers.find((o) => o._id === id || o.employee_id === id);
}

export function createOfficer(data: Partial<OfficerData>): OfficerData {
  const officers = getOfficers();
  const newOfficer: OfficerData = {
    _id: 'off-' + Math.random().toString(36).substring(2, 9),
    name: data.name || 'New Officer',
    employee_id: data.employee_id || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
    email: data.email || 'officer@dept.gov',
    phone: data.phone || '',
    designation: data.designation || 'Field Officer',
    department: data.department || 'General Administration',
    assigned_area: data.assigned_area || '',
    assigned_categories: data.assigned_categories || [],
    role: data.role || 'Officer',
    status: data.status || 'pending',
    skills: data.skills || {
      'Water Supply': 50,
      Electricity: 50,
      Roads: 50,
      Sanitation: 50,
      Healthcare: 50,
      'Public Safety': 50,
      Transport: 50,
      Environment: 50,
    },
    performance: data.performance || {
      resolution_rate: 85,
      sla_compliance: 80,
      citizen_rating: 4.2,
      avg_resolution_hrs: 12,
      reopened_count: 0,
      critical_resolved: 0,
      total_resolved: 0,
    },
    readiness_score: data.readiness_score || 85,
    overall_score: data.overall_score || 82,
    current_complaints: 0,
    location: data.location || { lat: 13.0827, lng: 80.2707 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  officers.unshift(newOfficer);
  return newOfficer;
}

export function updateOfficer(id: string, updates: Partial<OfficerData>): OfficerData | null {
  const officers = getOfficers();
  const index = officers.findIndex((o) => o._id === id || o.employee_id === id);
  if (index === -1) return null;

  officers[index] = {
    ...officers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return officers[index];
}
