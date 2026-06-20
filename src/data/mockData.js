export const DEPARTMENTS = [
  { id: 'dept-1', name: 'Hostel' },
  { id: 'dept-2', name: 'Revenue' },
  { id: 'dept-3', name: 'Municipal' },
  { id: 'dept-4', name: 'Health' },
  { id: 'dept-5', name: 'Transport' },
];

export const CATEGORIES = [
  // Hostel
  { id: 'cat-1', name: 'Food Quality', deptId: 'dept-1' },
  { id: 'cat-2', name: 'Maintenance & Repairs', deptId: 'dept-1' },
  { id: 'cat-7', name: 'Hostel Allocation', deptId: 'dept-1' },
  { id: 'cat-8', name: 'WiFi / Connectivity', deptId: 'dept-1' },
  // Revenue
  { id: 'cat-3', name: 'Land Disputes', deptId: 'dept-2' },
  { id: 'cat-9', name: 'Property Tax', deptId: 'dept-2' },
  { id: 'cat-10', name: 'Encroachment', deptId: 'dept-2' },
  // Municipal
  { id: 'cat-4', name: 'Water Supply', deptId: 'dept-3' },
  { id: 'cat-5', name: 'Electricity', deptId: 'dept-3' },
  { id: 'cat-11', name: 'Garbage / Sanitation', deptId: 'dept-3' },
  { id: 'cat-12', name: 'Road / Drainage', deptId: 'dept-3' },
  // Health
  { id: 'cat-6', name: 'Medical Negligence', deptId: 'dept-4' },
  { id: 'cat-13', name: 'Hospital Facilities', deptId: 'dept-4' },
  { id: 'cat-14', name: 'Ambulance Services', deptId: 'dept-4' },
  // Transport
  { id: 'cat-15', name: 'Rash Driving / Accidents', deptId: 'dept-5' },
  { id: 'cat-16', name: 'License / Registration Issues', deptId: 'dept-5' },
  { id: 'cat-17', name: 'Public Transport Complaint', deptId: 'dept-5' },
];

export const ROLES = [
  { id: 'role-admin', name: 'Super Admin', level: 0 },
  // Hostel
  { id: 'role-warden', name: 'Warden', departmentId: 'dept-1', level: 1 },
  { id: 'role-principal', name: 'Principal', departmentId: 'dept-1', level: 2 },
  { id: 'role-dean', name: 'Dean', departmentId: 'dept-1', level: 3 },
  // Revenue
  { id: 'role-vro', name: 'VRO', departmentId: 'dept-2', level: 1 },
  { id: 'role-mro', name: 'MRO', departmentId: 'dept-2', level: 2 },
  { id: 'role-collector', name: 'Collector', departmentId: 'dept-2', level: 3 },
  // Municipal
  { id: 'role-inspector', name: 'Municipal Inspector', departmentId: 'dept-3', level: 1 },
  { id: 'role-commissioner', name: 'Municipal Commissioner', departmentId: 'dept-3', level: 2 },
  // Health
  { id: 'role-doctor', name: 'Medical Officer', departmentId: 'dept-4', level: 1 },
  { id: 'role-health-director', name: 'Health Director', departmentId: 'dept-4', level: 2 },
  // Transport
  { id: 'role-mvi', name: 'Motor Vehicle Inspector', departmentId: 'dept-5', level: 1 },
  { id: 'role-rto', name: 'RTO', departmentId: 'dept-5', level: 2 },
  // Citizen
  { id: 'role-citizen', name: 'Citizen', level: 0 },
];

export const USERS = [
  { id: 'u-1', name: 'John Admin', roleId: 'role-admin', email: 'admin@system.com' },
  { id: 'u-2', name: 'Alice Warden', roleId: 'role-warden', deptId: 'dept-1', email: 'alice@hostel.com' },
  { id: 'u-3', name: 'Bob Citizen', roleId: 'role-citizen', email: 'bob@gmail.com' },
  { id: 'u-4', name: 'Dave MRO', roleId: 'role-mro', deptId: 'dept-2', email: 'dave@govt.com' },
  { id: 'u-5', name: 'Carol Inspector', roleId: 'role-inspector', deptId: 'dept-3', email: 'carol@municipal.com' },
  { id: 'u-6', name: 'Eve Medical', roleId: 'role-doctor', deptId: 'dept-4', email: 'eve@health.com' },
  { id: 'u-7', name: 'Frank MVI', roleId: 'role-mvi', deptId: 'dept-5', email: 'frank@transport.com' },
];

export const WORKFLOWS = [
  {
    id: 'wf-1',
    name: 'Hostel Complaint Workflow',
    deptId: 'dept-1',
    levels: ['role-warden', 'role-principal', 'role-dean'],
  },
  {
    id: 'wf-2',
    name: 'Revenue Complaint Workflow',
    deptId: 'dept-2',
    levels: ['role-vro', 'role-mro', 'role-collector'],
  },
  {
    id: 'wf-3',
    name: 'Municipal Complaint Workflow',
    deptId: 'dept-3',
    levels: ['role-inspector', 'role-commissioner'],
  },
  {
    id: 'wf-4',
    name: 'Health Complaint Workflow',
    deptId: 'dept-4',
    levels: ['role-doctor', 'role-health-director'],
  },
  {
    id: 'wf-5',
    name: 'Transport Complaint Workflow',
    deptId: 'dept-5',
    levels: ['role-mvi', 'role-rto'],
  },
];

export const INITIAL_COMPLAINTS = [
  {
    id: 'GRV-2026-0001',
    title: 'WIFI not working in Hostel A',
    description: 'Since 3 days the WIFI is completely down in Block A.',
    categoryId: 'cat-8',
    deptId: 'dept-1',
    priority: 'High',
    status: 'Assigned',
    userId: 'u-3',
    assignedOfficerId: 'u-2',
    escalationLevel: 1,
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-06-18T10:05:00Z',
    slaDeadline: '2026-06-20T10:00:00Z',
    timeline: [
      { status: 'Submitted', timestamp: '2026-06-18T10:00:00Z', remark: 'Complaint registered successfully' },
      { status: 'Assigned', timestamp: '2026-06-18T10:05:00Z', remark: 'Assigned to Warden Alice' },
    ],
  },
];
