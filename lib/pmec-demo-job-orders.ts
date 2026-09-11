import { demoDay, hoursAgo } from "./pmec-demo-dates";
import type { CostDocument, CostDocumentType, JobOrder, WorkPackageTask } from "./pmec-job-orders";

/**
 * The portfolio behind the PMEC showcase: seven job orders across Aruba, Egypt and Panama,
 * from planning through completion, with work packages, milestones and cost documents.
 *
 * Every date counts from today, so each timeline sits where its phase says it should:
 * achieved milestones behind, open ones ahead, and cost documents waiting a realistic
 * number of hours for approval. The Aruba jobs Percy Solagnier works on are the same
 * projects the employee showcase shows him.
 */

const d = (offset: number) => demoDay(offset);
const stamp = (offset: number) => new Date(`${demoDay(offset)}T09:00:00`).toISOString();

const task = (data: Omit<WorkPackageTask, "materialCost">): WorkPackageTask => ({
  ...data,
  materialCost: data.materials.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
});

type Upload = { at: string; by: string };
type Approval = { at: string; by: string; note?: string };

/** A cost document. Pass `approved` for one that has already been through review. */
function doc(id: string, description: string, documentType: CostDocumentType, amount: number, uploaded: Upload, tags: string[], approved?: Approval): CostDocument {
  return {
    id,
    url: `local://cost-documents/${id}`,
    description,
    documentType,
    amount,
    tags,
    uploadedAt: uploaded.at,
    uploadedBy: uploaded.by,
    approvalStatus: approved ? "APPROVED" : "PENDING",
    reviewNote: approved?.note,
    approvalHistory: approved
      ? [
          { id: `history-${id}-submitted`, status: "PENDING", changedAt: uploaded.at, changedBy: uploaded.by },
          { id: `history-${id}-approved`, status: "APPROVED", reviewNote: approved.note, changedAt: approved.at, changedBy: approved.by },
        ]
      : undefined,
  };
}

export const initialPmeJobOrders: JobOrder[] = [
  {
    id: "jo-coastal-substation", title: "Coastal Substation Electrical Retrofit",
    description: "Retrofit of a 13.8 kV coastal substation switchgear and protection relays, including SCADA integration and final commissioning.",
    clientName: "WEB Aruba N.V.", discipline: "ELECTRICAL", phase: "EXECUTION", priority: "HIGH", currency: "AWG", budget: 185000, contingencyPct: 12,
    quotationId: "Q-2025-118", netLaborMultiplier: 3.1, subcontractorName: "ELMAR N.V.", projectManagerName: "Aaron Croes", region: "ARUBA",
    startDate: d(-120), targetEndDate: d(75), clientApprovalDate: d(-150), clientApprovedBy: "Frank Tisellano",
    tags: ["electrical", "substation", "capital"], createdAt: stamp(-150), updatedAt: stamp(-1),
    milestones: [
      { id: "m1", label: "Client approval", targetDate: d(-150), achieved: true, achievedDate: d(-150) },
      { id: "m2", label: "Switchgear order placed", targetDate: d(-110), achieved: true, achievedDate: d(-107) },
      { id: "m3", label: "Switchgear delivered", targetDate: d(-14), achieved: true, achievedDate: d(-9) },
      { id: "m4", label: "Installation complete", targetDate: d(35), achieved: false },
      { id: "m5", label: "Commissioning & client sign-off", targetDate: d(68), achieved: false },
    ],
    tasks: [
      task({ id: "coastal-1", title: "Site survey & as-built verification", description: "Field survey of existing switchgear, cable routing, and protection relay settings.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "ELMAR N.V.", laborCost: 6200, materials: [], startDate: d(-120), dueDate: d(-108), completedDate: d(-110), notes: "Four circuits corrected against the as-built drawings.", wbsPhase: "01 — Site investigation & design" }),
      task({ id: "coastal-2", title: "Switchgear & relay procurement", description: "Procure replacement cubicles, relays, and control cable for the retrofit.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "ELMAR N.V.", laborCost: 3500, materials: [{ name: "13.8kV switchgear cubicle", quantity: 4, unit: "ea", unitCost: 18500 }, { name: "Microprocessor protection relay", quantity: 6, unit: "ea", unitCost: 3000 }, { name: "Control cable", quantity: 400, unit: "m", unitCost: 8.75 }], startDate: d(-110), dueDate: d(-14), completedDate: d(-9), notes: "Factory acceptance test passed; delivery landed five days late after a port hold.", wbsPhase: "02 — Procurement" }),
      task({ id: "coastal-3", title: "Switchgear installation & termination", description: "Install new switchgear cubicles and terminate control and power cabling.", discipline: "ELECTRICAL", status: "IN_PROGRESS", progress: 35, assignedTo: "ELMAR N.V.", laborCost: 24000, materials: [{ name: "Cable lugs & terminations", quantity: 120, unit: "ea", unitCost: 65 }, { name: "Termination kits", quantity: 8, unit: "kit", unitCost: 340 }], startDate: d(-6), dueDate: d(33), notes: "Cubicles 1 and 2 set on their plinths; outage for bus B requested.", wbsPhase: "03 — Installation" }),
      task({ id: "coastal-5", title: "SCADA point-to-point verification", description: "Verify every new status and control point between the relays and the utility's SCADA master.", discipline: "PROCESS_INSTRUMENTATION", status: "IN_PROGRESS", progress: 20, assignedTo: "Karim Fathy", laborCost: 7400, materials: [], startDate: d(-3), dueDate: d(30), notes: "Point list agreed with the client's SCADA team.", wbsPhase: "03 — Installation" }),
      task({ id: "coastal-4", title: "Commissioning, relay testing & handover", description: "Complete relay testing, SCADA verification, energization, and the client walkthrough.", discipline: "ELECTRICAL", status: "NOT_STARTED", progress: 0, assignedTo: "Sofia Arends", laborCost: 9800, materials: [], startDate: d(36), dueDate: d(68), wbsPhase: "04 — Commissioning & handover" }),
    ],
    costDocuments: [
      doc("coastal-switchgear-po", "Switchgear purchase order — ELMAR N.V.", "PURCHASE_RECEIPT", 98000, { at: stamp(-107), by: "Aaron Croes" }, ["Receipt", "Compliance"], { at: stamp(-106), by: "Aaron Croes", note: "Matches quotation Q-2025-118." }),
      doc("coastal-elmar-subcontract", "Installation subcontract — ELMAR N.V.", "CONTRACT", 64000, { at: stamp(-100), by: "Aaron Croes" }, ["Contract"], { at: stamp(-98), by: "Aaron Croes", note: "Signed by both parties." }),
      doc("coastal-elmar-invoice-2", "ELMAR progress invoice #2 — installation start", "SUBCONTRACTOR_INVOICE", 18500, { at: hoursAgo(20), by: "Aaron Croes" }, ["Invoice"]),
      doc("coastal-relay-test-rental", "Relay test set rental — six weeks", "PURCHASE_RECEIPT", 4200, { at: hoursAgo(60), by: "Karim Fathy" }, ["Receipt"]),
      doc("coastal-co-03", "Change order CO-03 — extra 40 m cable trench", "CHANGE_ORDER", 6800, { at: hoursAgo(75), by: "Aaron Croes" }, ["Change order"]),
    ],
  },
  {
    id: "jo-water-treatment", title: "Municipal Water Treatment Plant Upgrade — Phase II",
    description: "Detailed design for capacity expansion of the secondary treatment train, including instrumentation and updated process control networks.",
    clientName: "Greater Cairo Water & Sanitation Authority", discipline: "PROCESS_INSTRUMENTATION", phase: "DESIGN", priority: "CRITICAL", currency: "EGP", budget: 4200000, contingencyPct: 15,
    quotationId: "Q-2025-142", netLaborMultiplier: 3.2, projectManagerName: "Nour El-Sayed", region: "EGYPT",
    startDate: d(-210), targetEndDate: d(110),
    tags: ["water-treatment", "municipal", "phase-2"], createdAt: stamp(-220), updatedAt: stamp(-2),
    milestones: [
      { id: "m1", label: "Contract kickoff", targetDate: d(-210), achieved: true, achievedDate: d(-210) },
      { id: "m2", label: "30% design review", targetDate: d(-75), achieved: true, achievedDate: d(-71) },
      { id: "m3", label: "60% design review", targetDate: d(14), achieved: false },
      { id: "m4", label: "HAZOP complete", targetDate: d(45), achieved: false },
      { id: "m5", label: "Issued for construction", targetDate: d(100), achieved: false },
    ],
    tasks: [
      task({ id: "water-1", title: "Hydraulic modeling of expanded train", description: "Model the proposed secondary treatment expansion and confirm pump sizing.", discipline: "PROCESS_INSTRUMENTATION", status: "COMPLETED", progress: 100, assignedTo: "Nour El-Sayed", laborCost: 145000, materials: [], startDate: d(-210), dueDate: d(-160), completedDate: d(-163), notes: "Head margin confirmed for the initial scope.", wbsPhase: "01 — Process design" }),
      task({ id: "water-2", title: "Instrumentation & control philosophy", description: "Define the instrumentation list, control narrative, and SCADA integration approach.", discipline: "PROCESS_INSTRUMENTATION", status: "IN_PROGRESS", progress: 70, assignedTo: "Karim Fathy", laborCost: 120000, materials: [], startDate: d(-90), dueDate: d(10), notes: "Control narrative revision B is out for client comment.", wbsPhase: "02 — Instrumentation & controls" }),
      task({ id: "water-3", title: "P&ID development — issue for review", description: "Develop piping and instrumentation diagrams for the expanded train.", discipline: "PROCESS_INSTRUMENTATION", status: "IN_PROGRESS", progress: 25, assignedTo: "Mia Eman", laborCost: 260000, materials: [], startDate: d(-12), dueDate: d(40), notes: "Filter gallery P&IDs drafted; the blower building is next.", wbsPhase: "02 — Instrumentation & controls" }),
      task({ id: "water-5", title: "Chemical dosing skid specification", description: "Specify the coagulant and chlorine dosing skids, with redundancy and spill containment.", discipline: "PROCESS_INSTRUMENTATION", status: "NOT_STARTED", progress: 0, assignedTo: "Nour El-Sayed", laborCost: 90000, materials: [], startDate: d(5), dueDate: d(35), wbsPhase: "01 — Process design" }),
      task({ id: "water-4", title: "HAZOP workshop & action close-out", description: "Facilitate the HAZOP workshop with client and safety representatives and close out its actions.", discipline: "QUALITY_SAFETY", status: "NOT_STARTED", progress: 0, assignedTo: "Daniel Geerman", laborCost: 80000, materials: [{ name: "Workshop facilitation & venue", quantity: 1, unit: "lot", unitCost: 120000 }], startDate: d(38), dueDate: d(45), wbsPhase: "03 — Safety review" }),
    ],
    costDocuments: [
      doc("water-plc-vendor-quote", "Automation vendor quote — PLC panel package", "OTHER", 155000, { at: hoursAgo(52), by: "Nour El-Sayed" }, ["Vendor quote", "Compliance"]),
      doc("water-geotech-invoice", "Geotechnical survey invoice — blower building", "SUBCONTRACTOR_INVOICE", 185000, { at: stamp(-120), by: "Nour El-Sayed" }, ["Invoice"], { at: stamp(-118), by: "Nour El-Sayed", note: "Survey report received and filed." }),
      doc("water-modelling-licence", "Hydraulic modelling software licence — 12 months", "PURCHASE_RECEIPT", 42000, { at: stamp(-200), by: "Nour El-Sayed" }, ["Receipt"], { at: stamp(-199), by: "Nour El-Sayed" }),
    ],
  },
  {
    id: "jo-hospital-wing", title: "Hospital Wing Structural Assessment & Seismic Retrofit",
    description: "Structural assessment and seismic retrofit of an active hospital wing, including column jacketing, shear walls, and final recertification.",
    clientName: "Hospital Punta Pacífica Group", discipline: "CIVIL_STRUCTURAL", phase: "QA_INSPECTION", priority: "HIGH", currency: "USD", budget: 310000, contingencyPct: 10,
    quotationId: "Q-2025-076", netLaborMultiplier: 3.1, subcontractorName: "Estructuras del Istmo S.A.", projectManagerName: "Luis Herrera", region: "PANAMA",
    startDate: d(-380), targetEndDate: d(21), clientApprovalDate: d(-395), clientApprovedBy: "Dr. Elena Vasquez",
    tags: ["structural", "hospital", "critical-facility"], createdAt: stamp(-395), updatedAt: stamp(-1),
    milestones: [
      { id: "m1", label: "Assessment report approved", targetDate: d(-330), achieved: true, achievedDate: d(-330) },
      { id: "m2", label: "Retrofit design approved", targetDate: d(-270), achieved: true, achievedDate: d(-266) },
      { id: "m3", label: "Construction complete", targetDate: d(-120), achieved: true, achievedDate: d(-114) },
      { id: "m4", label: "Shear wall performance test", targetDate: d(-60), achieved: true, achievedDate: d(-58) },
      { id: "m5", label: "Structural recertification", targetDate: d(14), achieved: false },
    ],
    tasks: [
      task({ id: "hospital-1", title: "Structural condition assessment", description: "Visual and non-destructive assessment of the active wing.", discipline: "CIVIL_STRUCTURAL", status: "COMPLETED", progress: 100, assignedTo: "Luis Herrera", laborCost: 32000, materials: [{ name: "Rebar scanning & NDT services", quantity: 1, unit: "lot", unitCost: 4500 }], startDate: d(-380), dueDate: d(-333), completedDate: d(-333), wbsPhase: "01 — Assessment" }),
      task({ id: "hospital-2", title: "Retrofit design — column jacketing & shear walls", description: "Design reinforced concrete column jacketing and new shear walls.", discipline: "CIVIL_STRUCTURAL", status: "COMPLETED", progress: 100, assignedTo: "Luis Herrera", laborCost: 58000, materials: [], startDate: d(-330), dueDate: d(-270), completedDate: d(-266), wbsPhase: "01 — Assessment" }),
      task({ id: "hospital-3", title: "Column jacketing construction", description: "Construct reinforced concrete jacketing across 18 identified columns.", discipline: "CIVIL_STRUCTURAL", status: "COMPLETED", progress: 100, assignedTo: "Estructuras del Istmo S.A.", laborCost: 62000, materials: [{ name: "Ready-mix concrete", quantity: 65, unit: "m³", unitCost: 195 }, { name: "Reinforcement steel", quantity: 8500, unit: "kg", unitCost: 1.6 }, { name: "Formwork rental", quantity: 1, unit: "lot", unitCost: 12500 }], startDate: d(-250), dueDate: d(-190), completedDate: d(-186), wbsPhase: "02 — Construction" }),
      task({ id: "hospital-4", title: "New shear wall construction", description: "Construct two reinforced concrete shear walls at the stairwells.", discipline: "CIVIL_STRUCTURAL", status: "COMPLETED", progress: 100, assignedTo: "Estructuras del Istmo S.A.", laborCost: 41000, materials: [{ name: "Ready-mix concrete", quantity: 38, unit: "m³", unitCost: 195 }, { name: "Reinforcement steel", quantity: 6200, unit: "kg", unitCost: 1.6 }], startDate: d(-180), dueDate: d(-120), completedDate: d(-114), wbsPhase: "02 — Construction" }),
      task({ id: "hospital-5", title: "Structural re-certification & final report", description: "Complete inspection, load testing, and the updated seismic certification.", discipline: "QUALITY_SAFETY", status: "UNDER_REVIEW", progress: 88, assignedTo: "Luis Herrera", laborCost: 18500, materials: [{ name: "Third-party inspection fee", quantity: 1, unit: "lot", unitCost: 3200 }], startDate: d(-50), dueDate: d(10), notes: "Inspection complete; waiting on the signed certificate from the third-party engineer.", wbsPhase: "03 — Re-certification" }),
      task({ id: "hospital-6", title: "Fire-stopping at new wall penetrations", description: "Seal every service penetration through the new shear walls to the rated fire barrier.", discipline: "QUALITY_SAFETY", status: "BLOCKED", progress: 50, assignedTo: "Owen De Cuba", laborCost: 5500, materials: [{ name: "Intumescent sealant & collars", quantity: 1, unit: "lot", unitCost: 2600 }], startDate: d(-20), dueDate: d(7), notes: "Blocked: hospital facilities must open the level 2 ceiling void before work can finish.", wbsPhase: "03 — Re-certification" }),
    ],
    costDocuments: [
      doc("hospital-concrete-receipt", "Concrete supply receipt — shear walls", "PURCHASE_RECEIPT", 20115, { at: hoursAgo(58), by: "Luis Herrera" }, ["Receipt", "Invoice"]),
      doc("hospital-final-construction-invoice", "Estructuras del Istmo — final construction invoice", "SUBCONTRACTOR_INVOICE", 97500, { at: stamp(-100), by: "Luis Herrera" }, ["Invoice"], { at: stamp(-97), by: "Luis Herrera", note: "5% retention held until recertification." }),
      doc("hospital-inspection-agreement", "Third-party inspection agreement", "CONTRACT", 3200, { at: stamp(-55), by: "Luis Herrera" }, ["Contract", "Compliance"], { at: stamp(-54), by: "Luis Herrera" }),
    ],
  },
  {
    id: "jo-hotel-renovation", title: "Hotel Renovation — Mechanical & Electrical Upgrade",
    description: "Replacement of the central chiller plant, chilled-water pumps and guest-floor fan coil units, plus a new generator changeover panel, while the hotel stays open.",
    clientName: "Renaissance Aruba", discipline: "MECHANICAL", phase: "EXECUTION", priority: "HIGH", currency: "AWG", budget: 820000, contingencyPct: 10,
    quotationId: "Q-2026-031", netLaborMultiplier: 2.9, subcontractorName: "Coastline HVAC", projectManagerName: "Victor Quant", region: "ARUBA",
    startDate: d(-60), targetEndDate: d(95), clientApprovalDate: d(-75), clientApprovedBy: "Marisol Kock",
    tags: ["hvac", "hospitality", "occupied-building"], createdAt: stamp(-75), updatedAt: stamp(0),
    milestones: [
      { id: "m1", label: "Client approval", targetDate: d(-75), achieved: true, achievedDate: d(-75) },
      { id: "m2", label: "Chiller order placed", targetDate: d(-45), achieved: true, achievedDate: d(-44) },
      { id: "m3", label: "Plant room demolition complete", targetDate: d(-8), achieved: true, achievedDate: d(-6) },
      { id: "m4", label: "New chillers set and piped", targetDate: d(21), achieved: false },
      { id: "m5", label: "Commissioning & guest-floor handover", targetDate: d(85), achieved: false },
    ],
    tasks: [
      task({ id: "hotel-1", title: "Existing HVAC condition survey", description: "Survey the chiller plant, pumps and guest-floor units, and size the replacements.", discipline: "MECHANICAL", status: "COMPLETED", progress: 100, assignedTo: "Percy Solagnier", laborCost: 12000, materials: [], startDate: d(-60), dueDate: d(-50), completedDate: d(-51), notes: "Chiller 2 compressor at end of life; pumps undersized for the new load.", wbsPhase: "01 — Survey & design" }),
      task({ id: "hotel-2", title: "Chiller replacement — 2 × 350 TR", description: "Remove the two existing chillers and set, pipe and wire two new 350 TR water-cooled units.", discipline: "MECHANICAL", status: "IN_PROGRESS", progress: 45, assignedTo: "Coastline HVAC", laborCost: 48000, materials: [{ name: "350 TR water-cooled chiller", quantity: 2, unit: "ea", unitCost: 118000 }, { name: "Rigging & crane lift", quantity: 1, unit: "lot", unitCost: 6500 }], startDate: d(-20), dueDate: d(21), notes: "Crane lift booked with the hotel for the weekend.", wbsPhase: "02 — Plant room" }),
      task({ id: "hotel-3", title: "Chilled-water piping & pump replacement", description: "Replace the primary pumps and re-pipe the plant room headers for the new chillers.", discipline: "MECHANICAL", status: "IN_PROGRESS", progress: 30, assignedTo: "Percy Solagnier", laborCost: 38000, materials: [{ name: "Chilled-water pump set", quantity: 3, unit: "ea", unitCost: 14500 }, { name: "Insulated steel pipe & fittings", quantity: 1, unit: "lot", unitCost: 20500 }], startDate: d(-12), dueDate: d(28), notes: "Pump 3 base needs re-grouting before it is set.", wbsPhase: "02 — Plant room" }),
      task({ id: "hotel-5", title: "Generator changeover panel", description: "Supply and install an automatic transfer switch panel for the emergency generator.", discipline: "ELECTRICAL", status: "UNDER_REVIEW", progress: 90, assignedTo: "Sofia Arends", laborCost: 9500, materials: [{ name: "Automatic transfer switch panel", quantity: 1, unit: "ea", unitCost: 21000 }], startDate: d(-25), dueDate: d(2), notes: "Shop drawings are with the client's engineer for sign-off.", wbsPhase: "03 — Electrical" }),
      task({ id: "hotel-4", title: "Guest-floor fan coil replacement (floors 3–6)", description: "Replace 40 fan coil units floor by floor, two rooms out of service at a time.", discipline: "MECHANICAL", status: "NOT_STARTED", progress: 0, assignedTo: "Lina Loefstok", laborCost: 52000, materials: [{ name: "Fan coil unit", quantity: 40, unit: "ea", unitCost: 1850 }], startDate: d(14), dueDate: d(60), wbsPhase: "04 — Guest floors" }),
      task({ id: "hotel-6", title: "Test, adjust & balance; commissioning", description: "Balance the chilled-water system and commission the plant with the hotel's engineer.", discipline: "MECHANICAL", status: "NOT_STARTED", progress: 0, assignedTo: "Percy Solagnier", laborCost: 16000, materials: [], startDate: d(62), dueDate: d(85), wbsPhase: "05 — Commissioning" }),
    ],
    costDocuments: [
      doc("hotel-chiller-po", "Chiller purchase order — 2 × 350 TR", "PURCHASE_RECEIPT", 236000, { at: stamp(-44), by: "Victor Quant" }, ["Receipt"], { at: stamp(-43), by: "Aaron Croes", note: "Approved against quotation Q-2026-031." }),
      doc("hotel-coastline-mobilisation", "Coastline HVAC mobilisation invoice", "SUBCONTRACTOR_INVOICE", 28500, { at: hoursAgo(30), by: "Victor Quant" }, ["Invoice"]),
      doc("hotel-co-01", "Change order CO-01 — asbestos lagging removal", "CHANGE_ORDER", 14200, { at: hoursAgo(96), by: "Victor Quant" }, ["Change order", "Compliance"]),
      doc("hotel-crane-deposit", "Crane booking deposit — chiller lift", "PURCHASE_RECEIPT", 3500, { at: stamp(-5), by: "Percy Solagnier" }, ["Receipt"], { at: stamp(-4), by: "Victor Quant" }),
    ],
  },
  {
    id: "jo-electrical-install", title: "Workshop Electrical Installation — PMEC Yard",
    description: "A new main distribution board, cable tray and conduit runs, and ventilation fan circuits for the PMEC fabrication workshop.",
    clientName: "PMEC N.V.", discipline: "ELECTRICAL", phase: "EXECUTION", priority: "MEDIUM", currency: "AWG", budget: 96000, contingencyPct: 8,
    quotationId: "INT-2026-004", netLaborMultiplier: 2.4, projectManagerName: "Amelia Ruiz", region: "ARUBA",
    startDate: d(-45), targetEndDate: d(30),
    tags: ["electrical", "internal", "workshop"], createdAt: stamp(-50), updatedAt: stamp(-1),
    milestones: [
      { id: "m1", label: "Design freeze", targetDate: d(-38), achieved: true, achievedDate: d(-38) },
      { id: "m2", label: "Main board delivered", targetDate: d(-10), achieved: true, achievedDate: d(-4) },
      { id: "m3", label: "Energisation", targetDate: d(20), achieved: false },
      { id: "m4", label: "Handover & test certificate", targetDate: d(30), achieved: false },
    ],
    tasks: [
      task({ id: "yard-1", title: "Load schedule & single-line diagram", description: "Build the workshop load schedule and issue the single-line diagram.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "Theo Nichols", laborCost: 6500, materials: [], startDate: d(-45), dueDate: d(-38), completedDate: d(-38), wbsPhase: "01 — Design" }),
      task({ id: "yard-2", title: "Main distribution board replacement", description: "Replace the main distribution board and re-terminate the outgoing circuits.", discipline: "ELECTRICAL", status: "IN_PROGRESS", progress: 60, assignedTo: "Noah Croes", laborCost: 18000, materials: [{ name: "Main distribution board, 800 A", quantity: 1, unit: "ea", unitCost: 38400 }], startDate: d(-4), dueDate: d(18), notes: "Board set; the outgoing ways are being terminated.", wbsPhase: "02 — Installation" }),
      task({ id: "yard-3", title: "Cable tray & conduit runs", description: "Install cable tray, conduit and power cabling to the machine bays.", discipline: "ELECTRICAL", status: "IN_PROGRESS", progress: 75, assignedTo: "Noah Croes", laborCost: 14000, materials: [{ name: "Cable tray, 300 mm", quantity: 180, unit: "m", unitCost: 42 }, { name: "Power cable, 4 × 35 mm²", quantity: 260, unit: "m", unitCost: 20.5 }], startDate: d(-25), dueDate: d(10), wbsPhase: "02 — Installation" }),
      task({ id: "yard-4", title: "Ventilation fan circuits & controls", description: "Select the roof extract fans and coordinate their power and control wiring.", discipline: "MECHANICAL", status: "IN_PROGRESS", progress: 50, assignedTo: "Percy Solagnier", laborCost: 5200, materials: [{ name: "Roof extract fan", quantity: 4, unit: "ea", unitCost: 1450 }], startDate: d(-9), dueDate: d(15), notes: "Fan duty points confirmed; control wiring with Noah.", wbsPhase: "02 — Installation" }),
      task({ id: "yard-6", title: "EV charger circuits (change order CO-02)", description: "Add two 22 kW charger circuits in the yard car park.", discipline: "ELECTRICAL", status: "NOT_STARTED", progress: 0, assignedTo: "Noah Croes", laborCost: 3200, materials: [{ name: "22 kW EV charger", quantity: 2, unit: "ea", unitCost: 2200 }], startDate: d(12), dueDate: d(24), wbsPhase: "03 — Change orders" }),
      task({ id: "yard-5", title: "Testing & inspection certificate", description: "Test every circuit and issue the installation certificate.", discipline: "QUALITY_SAFETY", status: "NOT_STARTED", progress: 0, assignedTo: "Ella Thijsen", laborCost: 3800, materials: [], startDate: d(22), dueDate: d(30), wbsPhase: "04 — Handover" }),
    ],
    costDocuments: [
      doc("yard-main-board-receipt", "Main distribution board — purchase receipt", "PURCHASE_RECEIPT", 38400, { at: stamp(-6), by: "Amelia Ruiz" }, ["Receipt"], { at: stamp(-5), by: "Aaron Croes" }),
      doc("yard-cable-tray-invoice", "Cable & tray supply invoice", "PURCHASE_RECEIPT", 12900, { at: hoursAgo(8), by: "Noah Croes" }, ["Receipt", "Invoice"]),
      doc("yard-co-02", "Change order CO-02 — two EV charger circuits", "CHANGE_ORDER", 7600, { at: stamp(-14), by: "Amelia Ruiz" }, ["Change order"], { at: stamp(-13), by: "Aaron Croes", note: "Approved; funded from the workshop capex line." }),
    ],
  },
  {
    id: "jo-office-fitout", title: "Office Fit-out — Building C",
    description: "Fit-out of two office floors: HVAC, lighting and power, and fire and life safety, ready for tenant move-in.",
    clientName: "Oranjestad Business Park", discipline: "MECHANICAL", phase: "PLANNING", priority: "MEDIUM", currency: "AWG", budget: 215000, contingencyPct: 12,
    quotationId: "Q-2026-058", netLaborMultiplier: 3, projectManagerName: "Amelia Ruiz", region: "ARUBA",
    startDate: d(10), targetEndDate: d(140),
    tags: ["fit-out", "commercial", "tender"], createdAt: stamp(-12), updatedAt: stamp(-1),
    milestones: [
      { id: "m1", label: "Client brief signed", targetDate: d(-5), achieved: true, achievedDate: d(-5) },
      { id: "m2", label: "Design concept approved", targetDate: d(12), achieved: false },
      { id: "m3", label: "Tender issued", targetDate: d(30), achieved: false },
      { id: "m4", label: "Works start", targetDate: d(45), achieved: false },
      { id: "m5", label: "Handover to tenant", targetDate: d(140), achieved: false },
    ],
    tasks: [
      task({ id: "office-1", title: "Client brief & space programme", description: "Agree the space programme, occupancy and finishes with the client.", discipline: "PROJECT_MANAGEMENT", status: "COMPLETED", progress: 100, assignedTo: "Amelia Ruiz", laborCost: 4800, materials: [], startDate: d(-12), dueDate: d(-5), completedDate: d(-5), wbsPhase: "01 — Brief" }),
      task({ id: "office-2", title: "HVAC concept & load estimate", description: "Estimate cooling loads and compare system options for the two floors.", discipline: "MECHANICAL", status: "IN_PROGRESS", progress: 40, assignedTo: "Percy Solagnier", laborCost: 9600, materials: [], startDate: d(-4), dueDate: d(9), notes: "Two VRF options priced for the client meeting.", wbsPhase: "02 — Concept design" }),
      task({ id: "office-3", title: "Lighting & small power layout", description: "Lay out lighting, power and data for the open-plan floors.", discipline: "ELECTRICAL", status: "NOT_STARTED", progress: 0, assignedTo: "Olivia Maduro", laborCost: 7200, materials: [], startDate: d(2), dueDate: d(12), wbsPhase: "02 — Concept design" }),
      task({ id: "office-4", title: "Fire & life safety review", description: "Review escape routes, detection and fire damper locations against code.", discipline: "QUALITY_SAFETY", status: "NOT_STARTED", progress: 0, assignedTo: "Henry Peterson", laborCost: 3600, materials: [], startDate: d(8), dueDate: d(14), wbsPhase: "02 — Concept design" }),
      task({ id: "office-5", title: "Cost plan & tender package", description: "Prepare the cost plan and issue the tender package to three contractors.", discipline: "PROJECT_MANAGEMENT", status: "NOT_STARTED", progress: 0, assignedTo: "Nora Kock", laborCost: 6400, materials: [], startDate: d(14), dueDate: d(30), wbsPhase: "03 — Tender" }),
    ],
    costDocuments: [
      doc("office-fee-proposal", "Signed fee proposal & client brief", "CONTRACT", 18500, { at: stamp(-5), by: "Amelia Ruiz" }, ["Contract"], { at: stamp(-5), by: "Aaron Croes" }),
      doc("office-measured-survey", "Measured survey invoice — Building C", "SUBCONTRACTOR_INVOICE", 4750, { at: hoursAgo(14), by: "Amelia Ruiz" }, ["Invoice"]),
    ],
  },
  {
    id: "jo-solar-array", title: "Solar Panel Array — Rooftop PV, Phase 1",
    description: "A 1.1 MWp rooftop photovoltaic array with string inverters and grid connection at a utility service building.",
    clientName: "WEB Aruba N.V.", discipline: "ELECTRICAL", phase: "COMPLETED", priority: "LOW", currency: "AWG", budget: 420000, contingencyPct: 8,
    quotationId: "Q-2025-061", netLaborMultiplier: 2.8, subcontractorName: "Terra Solar", projectManagerName: "Aaron Croes", region: "ARUBA",
    startDate: d(-300), targetEndDate: d(-40), actualEndDate: d(-35), clientApprovalDate: d(-320), clientApprovedBy: "Frank Tisellano",
    tags: ["solar", "renewables", "handed-over"], createdAt: stamp(-320), updatedAt: stamp(-35),
    milestones: [
      { id: "m1", label: "Client approval", targetDate: d(-320), achieved: true, achievedDate: d(-320) },
      { id: "m2", label: "Roof assessment approved", targetDate: d(-270), achieved: true, achievedDate: d(-268) },
      { id: "m3", label: "Modules & inverters delivered", targetDate: d(-180), achieved: true, achievedDate: d(-176) },
      { id: "m4", label: "Grid connection", targetDate: d(-60), achieved: true, achievedDate: d(-52) },
      { id: "m5", label: "Performance test & handover", targetDate: d(-40), achieved: true, achievedDate: d(-35) },
    ],
    tasks: [
      task({ id: "solar-1", title: "Structural roof assessment", description: "Confirm the roof can carry the array and its wind loads.", discipline: "CIVIL_STRUCTURAL", status: "COMPLETED", progress: 100, assignedTo: "Gabriel Lacle", laborCost: 14000, materials: [], startDate: d(-300), dueDate: d(-270), completedDate: d(-268), wbsPhase: "01 — Assessment" }),
      task({ id: "solar-2", title: "PV module & inverter supply", description: "Supply the modules, string inverters and mounting system.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "Terra Solar", laborCost: 6000, materials: [{ name: "550 W PV module", quantity: 2000, unit: "ea", unitCost: 118 }, { name: "String inverter, 100 kW", quantity: 12, unit: "ea", unitCost: 5400 }], startDate: d(-260), dueDate: d(-180), completedDate: d(-176), wbsPhase: "02 — Supply" }),
      task({ id: "solar-3", title: "Mounting, installation & DC cabling", description: "Install the mounting rails, modules and DC string cabling.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "Terra Solar", laborCost: 42000, materials: [], startDate: d(-170), dueDate: d(-70), completedDate: d(-66), wbsPhase: "03 — Installation" }),
      task({ id: "solar-4", title: "Grid connection & protection settings", description: "Connect to the utility grid and set the interface protection.", discipline: "ELECTRICAL", status: "COMPLETED", progress: 100, assignedTo: "Sofia Arends", laborCost: 9000, materials: [], startDate: d(-68), dueDate: d(-55), completedDate: d(-52), wbsPhase: "04 — Connection" }),
      task({ id: "solar-5", title: "Performance test & handover", description: "Run the seven-day performance test and hand over the O&M file.", discipline: "QUALITY_SAFETY", status: "COMPLETED", progress: 100, assignedTo: "Ella Thijsen", laborCost: 5000, materials: [], startDate: d(-50), dueDate: d(-40), completedDate: d(-35), notes: "Performance ratio of 82.4% on the seven-day test.", wbsPhase: "05 — Handover" }),
    ],
    costDocuments: [
      doc("solar-supply-invoice", "Terra Solar supply invoice — modules & inverters", "SUBCONTRACTOR_INVOICE", 300800, { at: stamp(-175), by: "Aaron Croes" }, ["Invoice"], { at: stamp(-172), by: "Aaron Croes", note: "Checked against the delivery notes." }),
      doc("solar-install-invoice", "Terra Solar installation invoice", "SUBCONTRACTOR_INVOICE", 42000, { at: stamp(-64), by: "Aaron Croes" }, ["Invoice"], { at: stamp(-62), by: "Aaron Croes" }),
      doc("solar-grid-fee", "Grid connection fee receipt", "PURCHASE_RECEIPT", 6500, { at: stamp(-52), by: "Sofia Arends" }, ["Receipt"], { at: stamp(-51), by: "Aaron Croes" }),
    ],
  },
];
