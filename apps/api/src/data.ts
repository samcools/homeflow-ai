export type Project = {
  id: string; name: string; province: string; municipality: string; contractor: string; programme: string;
  status: 'Healthy' | 'Watch' | 'At Risk' | 'Critical' | 'Completed'; healthScore: number; confidence: number;
  budget: number; expenditure: number; physicalProgress: number; plannedProgress: number; unitsPlanned: number; unitsCompleted: number;
  overdueMilestones: number; openRisks: number; evidenceAgeDays: number; forecastCompletion: string; primaryBlocker: string;
  trend: 'improving' | 'stable' | 'deteriorating'; rootCauses: string[];
  recoveryActions: Array<{ id: string; title: string; owner: string; due: string; status: string }>;
  activity: Array<{ at: string; actor: string; action: string }>;
};

export const projects: Project[] = [
  {
    id: 'HF-102', name: 'Mamelodi Extension 18 Housing', province: 'Gauteng', municipality: 'City of Tshwane', contractor: 'Ubuntu Build Consortium', programme: 'BNG', status: 'Critical', healthScore: 34, confidence: 0.91,
    budget: 428000000, expenditure: 312440000, physicalProgress: 46, plannedProgress: 71, unitsPlanned: 820, unitsCompleted: 296, overdueMilestones: 4, openRisks: 7, evidenceAgeDays: 12, forecastCompletion: '2027-05-21', primaryBlocker: 'Bulk services connection delay', trend: 'deteriorating',
    rootCauses: ['Bulk infrastructure dependency', 'Contractor productivity decline', 'Inspection backlog'],
    recoveryActions: [
      { id: 'RA-201', title: 'Escalate bulk services connection approval', owner: 'Municipal Programme Manager', due: '2026-09-18', status: 'In progress' },
      { id: 'RA-202', title: 'Submit contractor 30-day recovery programme', owner: 'Ubuntu Build Consortium', due: '2026-09-16', status: 'Overdue' },
      { id: 'RA-203', title: 'Complete structural inspection backlog', owner: 'Regional Inspector', due: '2026-09-20', status: 'Open' }
    ],
    activity: [
      { at: '2026-09-13T08:25:00Z', actor: 'N. Mokoena', action: 'Uploaded site progress evidence' },
      { at: '2026-09-12T15:10:00Z', actor: 'HomeFlow AI', action: 'Raised budget-to-progress divergence warning' },
      { at: '2026-09-12T09:00:00Z', actor: 'T. Maseko', action: 'Escalated inspection backlog' }
    ]
  },
  {
    id: 'HF-118', name: 'Polokwane Integrated Human Settlements Phase 2', province: 'Limpopo', municipality: 'Polokwane', contractor: 'Mahlasedi Infrastructure', programme: 'Mixed Development', status: 'At Risk', healthScore: 52, confidence: 0.86,
    budget: 271000000, expenditure: 170730000, physicalProgress: 54, plannedProgress: 66, unitsPlanned: 540, unitsCompleted: 214, overdueMilestones: 2, openRisks: 4, evidenceAgeDays: 8, forecastCompletion: '2027-02-10', primaryBlocker: 'Material supply disruption', trend: 'stable',
    rootCauses: ['Material supply', 'Schedule slippage'], recoveryActions: [{ id: 'RA-211', title: 'Approve alternate material supplier', owner: 'Project Manager', due: '2026-09-19', status: 'Open' }],
    activity: [{ at: '2026-09-13T06:30:00Z', actor: 'M. Kgomo', action: 'Updated contractor programme' }]
  },
  {
    id: 'HF-125', name: 'eThekwini Informal Settlement Upgrade', province: 'KwaZulu-Natal', municipality: 'eThekwini', contractor: 'Sakhisizwe Civils', programme: 'Informal Settlement Upgrade', status: 'Watch', healthScore: 69, confidence: 0.88,
    budget: 198000000, expenditure: 110880000, physicalProgress: 57, plannedProgress: 61, unitsPlanned: 410, unitsCompleted: 188, overdueMilestones: 1, openRisks: 3, evidenceAgeDays: 4, forecastCompletion: '2026-12-18', primaryBlocker: 'Community access coordination', trend: 'improving',
    rootCauses: ['Community access coordination'], recoveryActions: [{ id: 'RA-220', title: 'Complete community access plan', owner: 'Stakeholder Lead', due: '2026-09-17', status: 'In progress' }],
    activity: [{ at: '2026-09-12T12:00:00Z', actor: 'P. Zulu', action: 'Resolved one community access issue' }]
  },
  {
    id: 'HF-131', name: 'Nelson Mandela Bay Social Housing Precinct', province: 'Eastern Cape', municipality: 'Nelson Mandela Bay', contractor: 'Ikhaya Urban Projects', programme: 'Social Housing', status: 'Healthy', healthScore: 86, confidence: 0.94,
    budget: 356000000, expenditure: 238520000, physicalProgress: 70, plannedProgress: 69, unitsPlanned: 620, unitsCompleted: 412, overdueMilestones: 0, openRisks: 1, evidenceAgeDays: 2, forecastCompletion: '2026-11-30', primaryBlocker: 'None material', trend: 'improving',
    rootCauses: [], recoveryActions: [], activity: [{ at: '2026-09-13T07:15:00Z', actor: 'L. Jacobs', action: 'Approved milestone inspection' }]
  },
  {
    id: 'HF-144', name: 'Matjhabeng Serviced Sites Programme', province: 'Free State', municipality: 'Matjhabeng', contractor: 'Kopano Development JV', programme: 'Serviced Sites', status: 'Critical', healthScore: 29, confidence: 0.89,
    budget: 149000000, expenditure: 99830000, physicalProgress: 38, plannedProgress: 68, unitsPlanned: 760, unitsCompleted: 190, overdueMilestones: 5, openRisks: 8, evidenceAgeDays: 33, forecastCompletion: '2027-08-15', primaryBlocker: 'Contractor inactivity and payment dispute', trend: 'deteriorating',
    rootCauses: ['Contractor inactivity', 'Payment dispute', 'Evidence gap'], recoveryActions: [{ id: 'RA-230', title: 'Convene contractual recovery meeting', owner: 'Provincial Programme Manager', due: '2026-09-15', status: 'Overdue' }],
    activity: [{ at: '2026-09-10T09:00:00Z', actor: 'HomeFlow AI', action: 'Flagged potential stalled project — review required' }]
  },
  {
    id: 'HF-150', name: 'George Affordable Housing Development', province: 'Western Cape', municipality: 'George', contractor: 'Cape Habitat Projects', programme: 'Affordable Housing', status: 'Completed', healthScore: 98, confidence: 0.97,
    budget: 221000000, expenditure: 217000000, physicalProgress: 100, plannedProgress: 100, unitsPlanned: 330, unitsCompleted: 330, overdueMilestones: 0, openRisks: 0, evidenceAgeDays: 1, forecastCompletion: '2026-08-28', primaryBlocker: 'None', trend: 'stable',
    rootCauses: [], recoveryActions: [], activity: [{ at: '2026-09-01T13:20:00Z', actor: 'S. Daniels', action: 'Closed final project handover' }]
  }
];

export const auditLog = [
  { at: '2026-09-13T08:25:00Z', user: 'N. Mokoena', role: 'Project Manager', record: 'HF-102', action: 'Evidence upload', aiAssisted: false },
  { at: '2026-09-12T15:10:00Z', user: 'HomeFlow AI', role: 'AI Service', record: 'HF-102', action: 'Risk recommendation created', aiAssisted: true },
  { at: '2026-09-12T09:00:00Z', user: 'T. Maseko', role: 'Programme Manager', record: 'HF-102', action: 'Issue escalated', aiAssisted: false },
  { at: '2026-09-10T09:00:00Z', user: 'HomeFlow AI', role: 'AI Service', record: 'HF-144', action: 'Potential stalled project flag created', aiAssisted: true }
];
