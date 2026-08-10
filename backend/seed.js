const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const mongoose = require('mongoose');
const Complaint   = require('./models/complaint');
const Officer     = require('./models/officer');
const Department  = require('./models/department');
const Translation = require('./models/translation');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa_project';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected:', MONGODB_URI);

  await Promise.all([
    Complaint.deleteMany({}),
    Officer.deleteMany({}),
    Department.deleteMany({}),
    Translation.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // -- Departments ----------------------------------------------
  await Department.insertMany([
    { name:'Electricity Department',  description:'Power grids, wiring, streetlights',    categories:['Electricity','Power Outage','Street Light'], color:'#f59e0b', icon:'Zap'       },
    { name:'Water Department',        description:'Water supply, pipeline leaks, sewage',  categories:['Water Supply','Pipeline','Sewage','Drainage'],color:'#3b82f6', icon:'Droplet'   },
    { name:'Public Works Department', description:'Roads, potholes, bridges',              categories:['Roads','Potholes','Infrastructure'],           color:'#f97316', icon:'HardHat'   },
    { name:'Sanitation Department',   description:'Garbage, cleanliness, waste',           categories:['Sanitation','Garbage','Waste','Pollution'],    color:'#10b981', icon:'Trash2'    },
    { name:'Health Department',       description:'Hospitals, public hygiene',             categories:['Healthcare','Hospital','Hygiene'],             color:'#ef4444', icon:'HeartPulse'},
    { name:'Police Department',       description:'Safety, crime, traffic',                categories:['Public Safety','Crime','Traffic','Emergency'], color:'#6366f1', icon:'Shield'    },
    { name:'Revenue Department',      description:'Land records, tax, certificates',       categories:['Transport','Land','Tax','Certificate'],        color:'#8b5cf6', icon:'FileText'  },
    { name:'General Administration', description:'Other public grievances',               categories:['Environment','General','Other'],               color:'#64748b', icon:'Building2' },
  ]);
  console.log('Seeded 8 departments');

  // -- Officers -------------------------------------------------
  const officers = await Officer.insertMany([
    {
      name:'Arjun Kumar', employee_id:'EMP001', email:'arjun.kumar@dsa.gov',
      phone:'9876543210', designation:'Senior Supervisor', department:'Electricity Department',
      assigned_area:'North Chennai', assigned_categories:['Electricity','Street Light'],
      role:'Supervisor', status:'active',
      skills:{'Water Supply':30,'Electricity':95,'Roads':45,'Sanitation':20,'Healthcare':25,'Public Safety':40,'Transport':35,'Environment':30},
      performance:{ resolution_rate:94, sla_compliance:91, citizen_rating:4.7, avg_resolution_hrs:4.2, reopened_count:2, critical_resolved:18, total_resolved:120 },
      readiness_score:96, overall_score:92,
      location:{ lat:13.0827, lng:80.2707 },
    },
    {
      name:'Priya Sharma', employee_id:'EMP002', email:'priya.sharma@dsa.gov',
      phone:'9876543211', designation:'Field Officer', department:'Water Department',
      assigned_area:'South Chennai', assigned_categories:['Water Supply','Drainage'],
      role:'Officer', status:'active',
      skills:{'Water Supply':88,'Electricity':20,'Roads':30,'Sanitation':60,'Healthcare':15,'Public Safety':10,'Transport':25,'Environment':50},
      performance:{ resolution_rate:87, sla_compliance:83, citizen_rating:4.4, avg_resolution_hrs:8.1, reopened_count:4, critical_resolved:10, total_resolved:95 },
      readiness_score:89, overall_score:85,
      location:{ lat:12.9716, lng:80.2437 },
    },
    {
      name:'Ravi Selvam', employee_id:'EMP003', email:'ravi.selvam@dsa.gov',
      phone:'9876543212', designation:'Field Officer', department:'Public Works Department',
      assigned_area:'Central Chennai', assigned_categories:['Roads','Potholes'],
      role:'Officer', status:'active',
      skills:{'Water Supply':40,'Electricity':35,'Roads':92,'Sanitation':30,'Healthcare':20,'Public Safety':25,'Transport':80,'Environment':30},
      performance:{ resolution_rate:78, sla_compliance:75, citizen_rating:4.1, avg_resolution_hrs:18.5, reopened_count:6, critical_resolved:8, total_resolved:72 },
      readiness_score:81, overall_score:77,
      location:{ lat:13.0600, lng:80.2500 },
    },
    {
      name:'Meena Devi', employee_id:'EMP004', email:'meena.devi@dsa.gov',
      phone:'9876543213', designation:'Senior Officer', department:'Sanitation Department',
      assigned_area:'West Chennai', assigned_categories:['Sanitation','Garbage','Waste'],
      role:'Supervisor', status:'active',
      skills:{'Water Supply':50,'Electricity':15,'Roads':20,'Sanitation':90,'Healthcare':45,'Public Safety':20,'Transport':15,'Environment':72},
      performance:{ resolution_rate:91, sla_compliance:88, citizen_rating:4.5, avg_resolution_hrs:10.3, reopened_count:3, critical_resolved:14, total_resolved:108 },
      readiness_score:93, overall_score:89,
      location:{ lat:13.0500, lng:80.2100 },
    },
    {
      name:'Suresh Babu', employee_id:'EMP005', email:'suresh.babu@dsa.gov',
      phone:'9876543214', designation:'Field Officer', department:'Health Department',
      assigned_area:'East Chennai', assigned_categories:['Healthcare','Hospital'],
      role:'Officer', status:'active',
      skills:{'Water Supply':25,'Electricity':20,'Roads':15,'Sanitation':55,'Healthcare':85,'Public Safety':30,'Transport':20,'Environment':40},
      performance:{ resolution_rate:82, sla_compliance:79, citizen_rating:4.2, avg_resolution_hrs:6.7, reopened_count:5, critical_resolved:12, total_resolved:83 },
      readiness_score:85, overall_score:80,
      location:{ lat:13.0900, lng:80.2900 },
    },
    {
      name:'Kavitha Nair', employee_id:'EMP006', email:'kavitha.nair@dsa.gov',
      phone:'9876543215', designation:'Inspector', department:'Police Department',
      assigned_area:'T Nagar', assigned_categories:['Public Safety','Crime','Traffic'],
      role:'Officer', status:'active',
      skills:{'Water Supply':10,'Electricity':15,'Roads':30,'Sanitation':10,'Healthcare':20,'Public Safety':95,'Transport':70,'Environment':15},
      performance:{ resolution_rate:96, sla_compliance:94, citizen_rating:4.8, avg_resolution_hrs:3.5, reopened_count:1, critical_resolved:22, total_resolved:135 },
      readiness_score:97, overall_score:95,
      location:{ lat:13.0400, lng:80.2342 },
    },
    {
      name:'Dinesh Raj', employee_id:'EMP007', email:'dinesh.raj@dsa.gov',
      phone:'9876543216', designation:'Revenue Officer', department:'Revenue Department',
      assigned_area:'Tambaram', assigned_categories:['Transport','Land','Tax'],
      role:'Supervisor', status:'leave',
      skills:{'Water Supply':15,'Electricity':20,'Roads':25,'Sanitation':15,'Healthcare':10,'Public Safety':15,'Transport':88,'Environment':20},
      performance:{ resolution_rate:73, sla_compliance:70, citizen_rating:3.9, avg_resolution_hrs:32.0, reopened_count:8, critical_resolved:5, total_resolved:58 },
      readiness_score:76, overall_score:71,
      location:{ lat:12.9249, lng:80.1000 },
    },
    {
      name:'Anitha Raj', employee_id:'EMP008', email:'anitha.raj@dsa.gov',
      phone:'9876543217', designation:'Junior Officer', department:'Water Department',
      assigned_area:'Adyar', assigned_categories:['Water Supply','Sewage'],
      role:'Officer', status:'active',
      skills:{'Water Supply':72,'Electricity':15,'Roads':20,'Sanitation':48,'Healthcare':12,'Public Safety':8,'Transport':18,'Environment':40},
      performance:{ resolution_rate:70, sla_compliance:68, citizen_rating:3.8, avg_resolution_hrs:14.0, reopened_count:9, critical_resolved:4, total_resolved:48 },
      readiness_score:74, overall_score:69,
      location:{ lat:13.0067, lng:80.2606 },
    },
  ]);
  console.log('Seeded', officers.length, 'officers');

  // -- Complaints -----------------------------------------------
  const now = new Date();
  const ago = (h) => new Date(now - h * 3600000);

  const complaints = await Complaint.insertMany([
    {
      ticket_id:'CMP10001', title:'Water leakage near district hospital',
      description:'Water leakage near the district hospital has been flooding the road for 3 days. Patients cannot reach emergency ward.',
      category:'Water Supply', department:'Water Department',
      priority:'Critical', status:'In Progress', location:'Near District Hospital, Sector 12',
      language:'English', sentiment:'urgent', duplicate_count:4,
      assigned_to: officers[1]._id, created_at: ago(48),
    },
    {
      ticket_id:'CMP10002', title:'Live electric wire near school',
      description:'Live electric wire hanging near the school gate. Children are at risk of electrocution.',
      category:'Electricity', department:'Electricity Department',
      priority:'Critical', status:'Assigned', location:'Government School, Sector 7',
      language:'English', sentiment:'urgent', duplicate_count:2,
      assigned_to: officers[0]._id, created_at: ago(5),
    },
    {
      ticket_id:'CMP10003', title:'Pothole on MG Road caused bike accident',
      description:'Large pothole on MG Road caused a bike accident last night. Needs urgent repair.',
      category:'Roads', department:'Public Works Department',
      priority:'High', status:'Assigned', location:'MG Road, T Nagar',
      language:'English', sentiment:'negative', duplicate_count:3,
      assigned_to: officers[2]._id, created_at: ago(20),
    },
    {
      ticket_id:'CMP10004', title:'Garbage not collected for 5 days',
      description:'Garbage not collected in Ward 4 for 5 consecutive days. Foul smell and mosquitoes everywhere.',
      category:'Sanitation', department:'Sanitation Department',
      priority:'High', status:'Registered', location:'Gandhi Nagar, Ward 4',
      language:'English', sentiment:'negative', duplicate_count:1,
      created_at: ago(3),
    },
    {
      ticket_id:'CMP10005', title:'Street light not working on Anna Salai',
      description:'3 consecutive streetlights on Anna Salai not working for a week. Very dark and dangerous.',
      category:'Electricity', department:'Electricity Department',
      priority:'Medium', status:'Resolved', location:'Anna Salai, Chennai',
      language:'English', sentiment:'negative',
      assigned_to: officers[0]._id, resolved_at: ago(2), created_at: ago(120),
    },
    {
      ticket_id:'CMP10006', title:'???? ??????? ?????????????',
      description:'?????? ???????? ???? ??????? ????? ?????? ???????? ??????????. ?????? ????? ???????????.',
      category:'Electricity', department:'Electricity Department',
      priority:'Medium', status:'Registered', location:'T Nagar, Chennai',
      language:'Tamil', sentiment:'negative', created_at: ago(30),
    },
    {
      ticket_id:'CMP10007', title:'Sewage overflow on main road',
      description:'Sewage is overflowing on to the main road near the market causing severe health hazard.',
      category:'Sanitation', department:'Sanitation Department',
      priority:'Critical', status:'In Progress', location:'Market Road, Aminjikarai',
      language:'English', sentiment:'urgent', duplicate_count:5,
      assigned_to: officers[3]._id, created_at: ago(10),
    },
    {
      ticket_id:'CMP10008', title:'Hospital not providing free medicines',
      description:'Government hospital is charging for medicines that should be free under the government scheme.',
      category:'Healthcare', department:'Health Department',
      priority:'High', status:'Assigned', location:'Government Hospital, Tambaram',
      language:'English', sentiment:'negative',
      assigned_to: officers[4]._id, created_at: ago(15),
    },
    {
      ticket_id:'CMP10009', title:'Stray dog menace in residential area',
      description:'Pack of stray dogs attacking pedestrians near the park in Velachery. 2 people bitten this week.',
      category:'Public Safety', department:'Police Department',
      priority:'High', status:'Resolved', location:'Velachery Park, Chennai',
      language:'English', sentiment:'urgent',
      assigned_to: officers[5]._id, resolved_at: ago(1), created_at: ago(72),
    },
    {
      ticket_id:'CMP10010', title:'???? ??????? ????????? ???? ????????',
      description:'?????? ???????? ???????? ????????. ??????? ??????? ?????? ???????????? ???? ???????? ??????.',
      category:'Water Supply', department:'Water Department',
      priority:'High', status:'Assigned', location:'Adyar, Chennai',
      language:'Tamil', sentiment:'urgent',
      assigned_to: officers[7]._id, created_at: ago(40),
    },
    {
      ticket_id:'CMP10011', title:'Road cave-in near bridge',
      description:'A large section of road has caved in near the Cooum river bridge. Vehicles are going around causing traffic.',
      category:'Roads', department:'Public Works Department',
      priority:'Critical', status:'Registered', location:'Cooum Bridge, Chennai',
      language:'English', sentiment:'urgent', duplicate_count:6,
      created_at: ago(2),
    },
    {
      ticket_id:'CMP10012', title:'Power outage for 8 hours',
      description:'Our area has had no power for 8 hours. All food in refrigerators is spoiling. Senior citizens are suffering in the heat.',
      category:'Electricity', department:'Electricity Department',
      priority:'High', status:'In Progress', location:'Anna Nagar West, Chennai',
      language:'English', sentiment:'urgent',
      assigned_to: officers[0]._id, created_at: ago(8),
    },
  ]);
  console.log('Seeded', complaints.length, 'complaints');

  // -- Translations ---------------------------------------------
  const translations = [
    { language:'en', key:'nav.home',          text:'Citizen Portal' },
    { language:'en', key:'nav.officer',       text:'Officer Hub' },
    { language:'en', key:'nav.command',       text:'AI Command' },
    { language:'en', key:'hero.title',        text:'Your voice, routed to the right hands' },
    { language:'en', key:'hero.subtitle',     text:'Submit a complaint and our AI instantly categorizes it' },
    { language:'en', key:'hero.cta_file',     text:'File a Complaint' },
    { language:'en', key:'hero.cta_track',    text:'Track a Complaint' },
    { language:'en', key:'form.title',        text:'File a New Complaint' },
    { language:'en', key:'form.description',  text:'Describe your issue' },
    { language:'en', key:'form.location',     text:'Location' },
    { language:'en', key:'form.submit',       text:'Submit Complaint' },
    { language:'en', key:'status.registered', text:'Registered' },
    { language:'en', key:'status.assigned',   text:'Assigned' },
    { language:'en', key:'status.inprogress', text:'In Progress' },
    { language:'en', key:'status.resolved',   text:'Resolved' },
    { language:'en', key:'priority.low',      text:'Low' },
    { language:'en', key:'priority.medium',   text:'Medium' },
    { language:'en', key:'priority.high',     text:'High' },
    { language:'en', key:'priority.critical', text:'Critical' },
    { language:'ta', key:'nav.home',          text:'?????????? ????????' },
    { language:'ta', key:'nav.officer',       text:'??????? ?????' },
    { language:'ta', key:'nav.command',       text:'AI ?????? ?????' },
    { language:'ta', key:'hero.title',        text:'?????? ????? ?????? ?????????' },
    { language:'ta', key:'hero.subtitle',     text:'?????? ??????????? - AI ???? ??????????????' },
    { language:'ta', key:'hero.cta_file',     text:'?????? ??????? ?????' },
    { language:'ta', key:'hero.cta_track',    text:'?????? ??????????' },
    { language:'ta', key:'form.title',        text:'????? ?????? ???????' },
    { language:'ta', key:'form.description',  text:'?????????? ????????????' },
    { language:'ta', key:'form.location',     text:'????' },
    { language:'ta', key:'form.submit',       text:'?????? ???????????????' },
    { language:'ta', key:'status.registered', text:'????? ?????????????' },
    { language:'ta', key:'status.assigned',   text:'????????????????' },
    { language:'ta', key:'status.inprogress', text:'??????? ??????' },
    { language:'ta', key:'status.resolved',   text:'???????????????' },
    { language:'ta', key:'priority.low',      text:'??????' },
    { language:'ta', key:'priority.medium',   text:'?????????' },
    { language:'ta', key:'priority.high',     text:'??????' },
    { language:'ta', key:'priority.critical', text:'??????' },
  ];
  await Translation.insertMany(translations);
  console.log('Seeded', translations.length, 'translations');

  console.log('\nALL SEEDED into dsa_project!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
