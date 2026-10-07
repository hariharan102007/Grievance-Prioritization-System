import {
  Droplet,
  Zap,
  HardHat,
  Trash2,
  HeartPulse,
  Shield,
  Trees,
  Bus,
  Building2,
  LucideIcon,
} from 'lucide-react';

export type DepartmentInfo = {
  slug: string;
  name: string;
  category: string;
  iconName: string;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  tagline: string;
  description: string;
  helpline: string;
  email: string;
  leadOfficer: {
    name: string;
    designation: string;
    phone: string;
  };
  targetSlaHours: number;
  services: string[];
  officers: {
    id: string;
    name: string;
    designation: string;
    status: 'Active' | 'On Field' | 'In Meeting';
    slaCompliance: number;
    rating: number;
    phone: string;
  }[];
};

export const DEPARTMENTS_DATA: DepartmentInfo[] = [
  {
    slug: 'water-department',
    name: 'Water Department',
    category: 'Water Supply',
    iconName: 'Droplet',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
    gradient: 'from-blue-600 via-sky-500 to-cyan-500',
    tagline: 'Ensuring clean, reliable, and uninterrupted municipal water supply.',
    description:
      'The Water Department manages urban water distribution pipelines, reservoir storage, drinking water purification, leak emergency response, and municipal tanker dispatch.',
    helpline: '1800-425-WATER (92837)',
    email: 'support.water@gov.in',
    leadOfficer: {
      name: 'Er. Rajesh Kumar',
      designation: 'Chief Water Works Engineer',
      phone: '+91 98765 43210',
    },
    targetSlaHours: 12,
    services: [
      'Main Pipeline Leakage & Burst Repair',
      'Drinking Water Supply Shortage & Contamination',
      'Water Tanker Emergency Dispatch',
      'Water Meter Testing & Replacement',
      'Sewerage Interconnection & Valve Maintenance',
    ],
    officers: [
      {
        id: 'off-w1',
        name: 'Er. Rajesh Kumar',
        designation: 'Chief Engineer',
        status: 'Active',
        slaCompliance: 96,
        rating: 4.8,
        phone: '+91 98765 43210',
      },
      {
        id: 'off-w2',
        name: 'Priya Sharma',
        designation: 'Assistant Engineer (Pipeline Maintenance)',
        status: 'On Field',
        slaCompliance: 92,
        rating: 4.6,
        phone: '+91 98765 43211',
      },
      {
        id: 'off-w3',
        name: 'Amitabh Singh',
        designation: 'Quality Control Specialist',
        status: 'Active',
        slaCompliance: 98,
        rating: 4.9,
        phone: '+91 98765 43212',
      },
    ],
  },
  {
    slug: 'electricity-department',
    name: 'Electricity Department',
    category: 'Electricity',
    iconName: 'Zap',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    tagline: 'Powering your neighborhood safely with 24x7 grid monitoring.',
    description:
      'The Electricity Department oversees power distribution grids, transformer maintenance, high-tension wire hazards, streetlight networks, and power restoration.',
    helpline: '1800-1912 (POWER-HELPLINE)',
    email: 'help.power@gov.in',
    leadOfficer: {
      name: 'Er. Ananya Sharma',
      designation: 'Superintending Electrical Engineer',
      phone: '+91 98765 11111',
    },
    targetSlaHours: 6,
    services: [
      'Unscheduled Power Outage Restoration',
      'Hanging or Damaged Electrical Cable Inspection',
      'Transformer Overload & Sparking Emergency',
      'Streetlight & High-Mast Lamp Maintenance',
      'Voltage Fluctuations & Meter Fault Rectification',
    ],
    officers: [
      {
        id: 'off-e1',
        name: 'Er. Ananya Sharma',
        designation: 'Superintending Engineer',
        status: 'Active',
        slaCompliance: 97,
        rating: 4.9,
        phone: '+91 98765 11111',
      },
      {
        id: 'off-e2',
        name: 'Karthik Raja',
        designation: 'Executive Engineer (Substation Ops)',
        status: 'On Field',
        slaCompliance: 94,
        rating: 4.7,
        phone: '+91 98765 11112',
      },
      {
        id: 'off-e3',
        name: 'Deepak Patel',
        designation: 'Streetlight Incharge',
        status: 'Active',
        slaCompliance: 90,
        rating: 4.5,
        phone: '+91 98765 11113',
      },
    ],
  },
  {
    slug: 'public-works-department',
    name: 'Public Works Department',
    category: 'Roads',
    iconName: 'HardHat',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-500/30',
    gradient: 'from-orange-600 via-amber-600 to-yellow-600',
    tagline: 'Building durable civic roads, bridges, and public infrastructure.',
    description:
      'Public Works Department (PWD) is responsible for urban road resurfacing, pothole filling, storm drain construction, pedestrian footpaths, and public building maintenance.',
    helpline: '1800-425-PWD (793)',
    email: 'pwd.civic@gov.in',
    leadOfficer: {
      name: 'Er. Vikramaditya Singh',
      designation: 'Chief Executive PWD Engineer',
      phone: '+91 98765 22222',
    },
    targetSlaHours: 36,
    services: [
      'Pothole Repair & Road Asphalt Patchwork',
      'Damaged Pedestrian Footpath & Curb Repair',
      'Stormwater Drain Construction & Unclogging',
      'Bridge & Flyover Structural Safety Audit',
      'Bus Stop Shelter Restoration & Signage',
    ],
    officers: [
      {
        id: 'off-p1',
        name: 'Er. Vikramaditya Singh',
        designation: 'Chief Executive Engineer',
        status: 'Active',
        slaCompliance: 91,
        rating: 4.6,
        phone: '+91 98765 22222',
      },
      {
        id: 'off-p2',
        name: 'Sonal Verma',
        designation: 'Sub-Divisional Road Engineer',
        status: 'On Field',
        slaCompliance: 89,
        rating: 4.4,
        phone: '+91 98765 22223',
      },
    ],
  },
  {
    slug: 'sanitation-department',
    name: 'Sanitation Department',
    category: 'Sanitation',
    iconName: 'Trash2',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-600 via-teal-500 to-green-500',
    tagline: 'Keep our city clean, green, and zero-waste compliant.',
    description:
      'The Sanitation Department manages daily solid waste collection, public dustbin clearance, sewage overflow treatment, vector control, and public toilet maintenance.',
    helpline: '1800-425-CLEAN (25326)',
    email: 'clean.sanitation@gov.in',
    leadOfficer: {
      name: 'Dr. Sunita Rao',
      designation: 'Chief Health & Sanitation Inspector',
      phone: '+91 98765 33333',
    },
    targetSlaHours: 18,
    services: [
      'Solid Waste Garbage Dump Removal',
      'Sewage Line Blockage & Overflow Clearing',
      'Public Toilet Disinfection & Sanitation',
      'Mosquito Fogging & Anti-Larval Drive',
      'Commercial Waste Disposal Audit',
    ],
    officers: [
      {
        id: 'off-s1',
        name: 'Dr. Sunita Rao',
        designation: 'Chief Sanitation Officer',
        status: 'Active',
        slaCompliance: 95,
        rating: 4.8,
        phone: '+91 98765 33333',
      },
      {
        id: 'off-s2',
        name: 'Ramesh Sundaram',
        designation: 'Zone Sanitation Inspector',
        status: 'On Field',
        slaCompliance: 93,
        rating: 4.6,
        phone: '+91 98765 33334',
      },
    ],
  },
  {
    slug: 'health-department',
    name: 'Health Department',
    category: 'Healthcare',
    iconName: 'HeartPulse',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    gradient: 'from-rose-600 via-pink-500 to-red-500',
    tagline: 'Delivering responsive emergency health and public medical services.',
    description:
      'The Health Department supervises municipal hospitals, primary health centers, ambulance operations, epidemic vigilance, and public medical supply safety.',
    helpline: '108 / 1800-425-HEALTH',
    email: 'health.grievance@gov.in',
    leadOfficer: {
      name: 'Dr. Arvind Swaminathan',
      designation: 'District Medical Officer (DMO)',
      phone: '+91 98765 44444',
    },
    targetSlaHours: 8,
    services: [
      'Municipal Hospital & OPD Service Feedback',
      'Ambulance 108 Dispatch Coordination',
      'Essential Medicines & Vaccination Availability',
      'Epidemic & Contagious Disease Reporting',
      'Food Safety & Restaurant Hygiene Inspection',
    ],
    officers: [
      {
        id: 'off-h1',
        name: 'Dr. Arvind Swaminathan',
        designation: 'District Medical Officer',
        status: 'Active',
        slaCompliance: 99,
        rating: 4.95,
        phone: '+91 98765 44444',
      },
      {
        id: 'off-h2',
        name: 'Dr. Meera Nambiar',
        designation: 'Public Health Coordinator',
        status: 'In Meeting',
        slaCompliance: 96,
        rating: 4.8,
        phone: '+91 98765 44445',
      },
    ],
  },
  {
    slug: 'police-department',
    name: 'Police Department',
    category: 'Public Safety',
    iconName: 'Shield',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    gradient: 'from-indigo-600 via-violet-600 to-purple-600',
    tagline: 'Safeguarding communities, maintaining order, and enforcing law.',
    description:
      'The Police Department ensures public safety, manages traffic control junctions, handles stray animal threats, monitors neighborhood safety, and resolves civic disputes.',
    helpline: '112 / 100 Emergency Control Room',
    email: 'safety.police@gov.in',
    leadOfficer: {
      name: 'ACP Manoj Verma',
      designation: 'Assistant Commissioner of Police',
      phone: '+91 98765 55555',
    },
    targetSlaHours: 10,
    services: [
      'Traffic Signal & Junction Safety Regulation',
      'Stray Dog / Nuisance Animal Relocation Control',
      'Night Patrol & Neighborhood Crime Prevention',
      'Public Nuisance & Illegal Encroachment Clearance',
      'Emergency Citizen Safety Assistance',
    ],
    officers: [
      {
        id: 'off-p1',
        name: 'ACP Manoj Verma',
        designation: 'Assistant Commissioner',
        status: 'Active',
        slaCompliance: 97,
        rating: 4.9,
        phone: '+91 98765 55555',
      },
      {
        id: 'off-p2',
        name: 'Inspector Inspector Vikas Reddy',
        designation: 'Station House Officer (SHO)',
        status: 'On Field',
        slaCompliance: 94,
        rating: 4.7,
        phone: '+91 98765 55556',
      },
    ],
  },
  {
    slug: 'environment-department',
    name: 'Environment Department',
    category: 'Environment',
    iconName: 'Trees',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    border: 'border-teal-500/30',
    gradient: 'from-teal-600 via-emerald-600 to-green-600',
    tagline: 'Preserving urban green cover, air purity, and ecological balance.',
    description:
      'The Environment Department monitors air quality index (AQI), tree preservation, industrial noise pollution, urban park greening, and lake rejuvenation.',
    helpline: '1800-425-GREEN (47336)',
    email: 'env.green@gov.in',
    leadOfficer: {
      name: 'Mrs. Gayatri Patel',
      designation: 'Conservator of Forests & Urban Greenery',
      phone: '+91 98765 66666',
    },
    targetSlaHours: 24,
    services: [
      'Dangerous / Fallen Tree Trimming & Clearing',
      'Industrial Noise & Air Pollution Inspection',
      'Urban Park & Green Belt Maintenance',
      'Lake & Water Body Eco Protection',
      'Plastic Ban & Pollution Compliance',
    ],
    officers: [
      {
        id: 'off-env1',
        name: 'Mrs. Gayatri Patel',
        designation: 'Conservator of Forests',
        status: 'Active',
        slaCompliance: 93,
        rating: 4.75,
        phone: '+91 98765 66666',
      },
    ],
  },
  {
    slug: 'transport-department',
    name: 'Public Transport Department',
    category: 'Transport',
    iconName: 'Bus',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    gradient: 'from-purple-600 via-indigo-500 to-sky-600',
    tagline: 'Providing reliable, comfortable, and timely public transit.',
    description:
      'The Public Transport Department manages city bus fleets, metro connectivity, bus terminal upkeep, auto-rickshaw fare compliance, and transit schedules.',
    helpline: '1800-425-BUS (287)',
    email: 'transport.help@gov.in',
    leadOfficer: {
      name: 'Mr. Suresh Kumar',
      designation: 'General Manager (Metropolitan Transit)',
      phone: '+91 98765 77777',
    },
    targetSlaHours: 24,
    services: [
      'City Bus Route Delay & Frequency Complaints',
      'Bus Stop Shelter Maintenance & Lighting',
      'Auto / Taxi Overcharging & Refusal Reporting',
      'Metro Transit Pass & Station Facility Issues',
      'Eco-Friendly Electric Bus Operation',
    ],
    officers: [
      {
        id: 'off-tr1',
        name: 'Mr. Suresh Kumar',
        designation: 'General Manager Transit',
        status: 'Active',
        slaCompliance: 92,
        rating: 4.65,
        phone: '+91 98765 77777',
      },
    ],
  },
];

export function getDepartmentBySlug(slug: string): DepartmentInfo | undefined {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  return DEPARTMENTS_DATA.find((d) => d.slug === normalized || d.name.toLowerCase() === normalized);
}

export function getDepartmentByName(name: string): DepartmentInfo | undefined {
  const normalized = decodeURIComponent(name).toLowerCase().trim();
  return DEPARTMENTS_DATA.find((d) => d.name.toLowerCase() === normalized || d.slug === normalized);
}

export function getIconComponent(iconName: string): LucideIcon {
  switch (iconName) {
    case 'Droplet':
      return Droplet;
    case 'Zap':
      return Zap;
    case 'HardHat':
      return HardHat;
    case 'Trash2':
      return Trash2;
    case 'HeartPulse':
      return HeartPulse;
    case 'Shield':
      return Shield;
    case 'Trees':
      return Trees;
    case 'Bus':
      return Bus;
    default:
      return Building2;
  }
}
