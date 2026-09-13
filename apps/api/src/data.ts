export type ProjectStatus = 'Healthy' | 'Watch' | 'At Risk' | 'Critical' | 'Completed';
export type Project = {
  id: string; name: string; province: string; municipality: string; contractor: string; programme: string;
  status: ProjectStatus; healthScore: number; confidence: number; budget: number; expenditure: number;
  physicalProgress: number; plannedProgress: number; unitsPlanned: number; unitsCompleted: number;
  overdueMilestones: number; openRisks: number; evidenceAgeDays: number; forecastCompletion: string;
  primaryBlocker: string; trend: 'improving' | 'stable' | 'deteriorating'; rootCauses: string[];
  projectManager: string; implementingAgent: string; ward: string; stage: string; startDate: string;
  recoveryActions: Array<{ id: string; title: string; owner: string; due: string; status: string }>;
  activity: Array<{ at: string; actor: string; action: string }>;
};

const seeds: Array<[string,string,string,string,string,string]> = [
  ['Gauteng','City of Tshwane','Mamelodi Extension 18 Housing','Ubuntu Build Consortium','BNG','Bulk services connection delay'],
  ['Gauteng','City of Johannesburg','Alexandra Renewal Phase 4','Ubuntu Build Consortium','Informal Settlement Upgrade','Relocation sequencing'],
  ['Gauteng','Ekurhuleni','Tembisa Mega Housing Precinct','Mahlasedi Infrastructure','Mixed Development','Electrical service connection'],
  ['Gauteng','Emfuleni','Sebokeng Serviced Sites','Kopano Development JV','Serviced Sites','Township establishment approval'],
  ['KwaZulu-Natal','eThekwini','eThekwini Informal Settlement Upgrade','Sakhisizwe Civils','Informal Settlement Upgrade','Community access coordination'],
  ['KwaZulu-Natal','Msunduzi','Vulindlela Rural Housing','Sakhisizwe Civils','Rural Housing','Material supply disruption'],
  ['KwaZulu-Natal','KwaDukuza','KwaDukuza Affordable Housing','Ubuntu Build Consortium','Affordable Housing','Professional team capacity'],
  ['KwaZulu-Natal','Newcastle','Madadeni Housing Renewal','Kopano Development JV','BNG','Payment certification delay'],
  ['Limpopo','Polokwane','Polokwane Integrated Human Settlements Phase 2','Mahlasedi Infrastructure','Mixed Development','Material supply disruption'],
  ['Limpopo','Makhado','Makhado Rural Housing Cluster','Thavhani Projects','Rural Housing','Access road dependency'],
  ['Limpopo','Mogalakwena','Mokopane Serviced Sites','Thavhani Projects','Serviced Sites','Water connection delay'],
  ['Limpopo','Greater Tzaneen','Tzaneen Social Housing Node','Ikhaya Urban Projects','Social Housing','Design approval backlog'],
  ['Eastern Cape','Nelson Mandela Bay','Nelson Mandela Bay Social Housing Precinct','Ikhaya Urban Projects','Social Housing','None material'],
  ['Eastern Cape','Buffalo City','Mdantsane Housing Renewal','Masakhane Housing Partners','BNG','Contractor productivity decline'],
  ['Eastern Cape','OR Tambo','Mthatha Rural Housing Programme','Masakhane Housing Partners','Rural Housing','Land parcel verification'],
  ['Eastern Cape','Dr Beyers Naude','Graaff-Reinet Serviced Sites','Kopano Development JV','Serviced Sites','Bulk sanitation dependency'],
  ['Free State','Matjhabeng','Matjhabeng Serviced Sites Programme','Kopano Development JV','Serviced Sites','Contractor inactivity and payment dispute'],
  ['Free State','Mangaung','Mangaung Integrated Housing Phase 3','Ubuntu Build Consortium','Mixed Development','Procurement dependency'],
  ['Free State','Maluti-a-Phofung','QwaQwa Housing Upgrade','Mahlasedi Infrastructure','BNG','Weather and access constraints'],
  ['Free State','Moqhaka','Kroonstad Affordable Housing','Cape Habitat Projects','Affordable Housing','None material'],
  ['Western Cape','George','George Affordable Housing Development','Cape Habitat Projects','Affordable Housing','None'],
  ['Western Cape','City of Cape Town','Khayelitsha Incremental Upgrade','Cape Habitat Projects','Informal Settlement Upgrade','Service relocation dependency'],
  ['Western Cape','Drakenstein','Paarl Social Housing Programme','Ikhaya Urban Projects','Social Housing','Planning approval delay'],
  ['Western Cape','Mossel Bay','Mossel Bay First Home Finance Precinct','Cape Habitat Projects','First Home Finance','None material'],
  ['Mpumalanga','Mbombela','Mbombela Integrated Settlement','Sisonke Construction Group','Mixed Development','Bulk water pressure constraint'],
  ['Mpumalanga','Emalahleni','Emalahleni Housing Expansion','Sisonke Construction Group','BNG','Material price escalation'],
  ['Mpumalanga','Steve Tshwete','Middelburg Serviced Sites','Mahlasedi Infrastructure','Serviced Sites','Electrical connection delay'],
  ['Mpumalanga','Bushbuckridge','Bushbuckridge Rural Housing','Thavhani Projects','Rural Housing','Access and logistics'],
  ['North West','Rustenburg','Rustenburg Mining Community Housing','Bokone BuildWorks','Affordable Housing','Land release dependency'],
  ['North West','Mahikeng','Mahikeng Housing Renewal','Bokone BuildWorks','BNG','Inspection backlog'],
  ['North West','JB Marks','Potchefstroom Social Housing','Ikhaya Urban Projects','Social Housing','None material'],
  ['North West','Madibeng','Brits Serviced Sites','Kopano Development JV','Serviced Sites','Community stakeholder dispute'],
  ['Northern Cape','Sol Plaatje','Kimberley Housing Consolidation','Karoo Habitat JV','BNG','Contractor mobilisation'],
  ['Northern Cape','Dawid Kruiper','Upington Affordable Housing','Karoo Habitat JV','Affordable Housing','Material logistics'],
  ['Northern Cape','Ga-Segonyana','Kuruman Rural Housing','Thavhani Projects','Rural Housing','Water availability'],
  ['Northern Cape','Nama Khoi','Springbok Serviced Sites','Karoo Habitat JV','Serviced Sites','Long-lead electrical equipment']
];

const managers = ['N. Mokoena','T. Maseko','P. Zulu','L. Jacobs','M. Kgomo','S. Daniels','A. Molefe','K. Dlamini','Z. Mbeki'];
const agents = ['Provincial Human Settlements','Municipal Housing Unit','Regional Implementing Agency','Metro Housing Delivery Office'];
const stages = ['Planning','Infrastructure','Top structures','Internal works','Inspection & handover'];

export const projects: Project[] = seeds.map((s,i) => {
  const [province,municipality,name,contractor,programme,blocker] = s;
  const pattern = i % 9;
  const completed = [4,8].includes(pattern);
  const health = completed ? (pattern===8 ? 98 : 91) : [34,52,68,82,88,45,73,29,96][pattern];
  const status: ProjectStatus = completed ? 'Completed' : health < 40 ? 'Critical' : health < 60 ? 'At Risk' : health < 80 ? 'Watch' : 'Healthy';
  const planned = completed ? 100 : Math.min(94, 48 + ((i*7)%43));
  const lag = status==='Critical' ? 24 : status==='At Risk' ? 14 : status==='Watch' ? 6 : 0;
  const physical = completed ? 100 : Math.max(18, planned-lag);
  const unitsPlanned = 260 + ((i*83)%760);
  const unitsCompleted = completed ? unitsPlanned : Math.round(unitsPlanned * physical/100 * .91);
  const budget = 118000000 + ((i*37000000)%390000000);
  const spendPct = completed ? 97 : Math.min(93, physical + (status==='Critical'?26:status==='At Risk'?16:status==='Watch'?8:2));
  const expenditure = Math.round(budget * spendPct/100);
  const overdue = completed ? 0 : status==='Critical' ? 4+(i%3) : status==='At Risk' ? 2+(i%2) : status==='Watch' ? 1 : 0;
  const risks = completed ? 0 : status==='Critical' ? 7+(i%3) : status==='At Risk' ? 4+(i%2) : status==='Watch' ? 2+(i%2) : 1;
  const evidenceAgeDays = completed ? 1+(i%3) : status==='Critical' ? 18+(i%19) : status==='At Risk' ? 9+(i%8) : 2+(i%6);
  const trend: Project['trend'] = status==='Critical' ? 'deteriorating' : status==='At Risk' ? (i%2?'stable':'deteriorating') : status==='Watch' ? 'stable' : 'improving';
  const pm = managers[i%managers.length];
  const id = `HF-${102+i*3}`;
  const recoveryActions = status==='Critical' || status==='At Risk' ? [
    { id:`RA-${300+i*2}`, title:`Resolve ${blocker.toLowerCase()}`, owner:pm, due:`2026-09-${String(15+(i%12)).padStart(2,'0')}`, status: i%3===0?'Overdue':'In progress' },
    { id:`RA-${301+i*2}`, title:'Submit 30-day delivery recovery programme', owner:contractor, due:`2026-09-${String(18+(i%9)).padStart(2,'0')}`, status:'Open' }
  ] : [];
  return {
    id,name,province,municipality,contractor,programme,status,healthScore:health,confidence:Number((.84+(i%12)/100).toFixed(2)),
    budget,expenditure,physicalProgress:physical,plannedProgress:planned,unitsPlanned,unitsCompleted,
    overdueMilestones:overdue,openRisks:risks,evidenceAgeDays,forecastCompletion: completed?'2026-08-30':`2027-${String(1+(i%8)).padStart(2,'0')}-${String(10+(i%17)).padStart(2,'0')}`,
    primaryBlocker:blocker,trend,rootCauses:blocker.startsWith('None')?[]:[blocker,'Schedule coordination',status==='Critical'?'Delivery recovery required':'Active monitoring'],
    projectManager:pm,implementingAgent:agents[i%agents.length],ward:`Ward ${1+(i*7)%96}`,stage:completed?'Completed':stages[i%stages.length],startDate:`2025-${String(1+(i%11)).padStart(2,'0')}-01`,
    recoveryActions,
    activity:[
      {at:`2026-09-${String(13-(i%5)).padStart(2,'0')}T08:25:00Z`,actor:pm,action:'Updated project delivery status'},
      {at:`2026-09-${String(12-(i%4)).padStart(2,'0')}T15:10:00Z`,actor:'HomeFlow AI',action: status==='Critical'||status==='At Risk'?'Raised delivery exception insight':'Refreshed project health assessment'},
      {at:`2026-09-${String(11-(i%3)).padStart(2,'0')}T09:00:00Z`,actor:contractor,action:'Submitted weekly progress update'}
    ]
  };
});

export const auditLog = [
  { at:'2026-09-13T13:05:00Z', user:'Samson Admin', role:'Administrator', record:'Platform', action:'Signed in to HomeFlow AI', aiAssisted:false },
  { at:'2026-09-13T12:42:00Z', user:'N. Mokoena', role:'Provincial Programme Manager', record:'Mamelodi Extension 18 Housing', action:'Reviewed recovery plan', aiAssisted:false },
  { at:'2026-09-13T12:30:00Z', user:'HomeFlow AI', role:'AI Service', record:'Mamelodi Extension 18 Housing', action:'Risk recommendation created', aiAssisted:true },
  { at:'2026-09-13T11:18:00Z', user:'P. Zulu', role:'Site Inspector', record:'eThekwini Informal Settlement Upgrade', action:'Reviewed site evidence', aiAssisted:false },
  { at:'2026-09-13T10:10:00Z', user:'Executive Demo', role:'National Executive', record:'Portfolio', action:'Generated executive brief', aiAssisted:true }
];
