import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DemoBar, DemoButton, DemoFrame, DemoMetric, DemoSection, DemoTag, demoStyles } from "@/components/pmec-desktop-demo-kit";

const people = [
  { id: "maria", name: "Maria de Vries", role: "Electrical Engineer", team: "Electrical", allocation: 92, detail: "Two active delivery packages · returns from leave 06 Mar", tone: "amber" as const },
  { id: "jordan", name: "Jordan Smith", role: "Project Controls", team: "PMO", allocation: 68, detail: "Available for next project review · no leave pending", tone: "green" as const },
  { id: "isabel", name: "Isabel Romero", role: "HSE Coordinator", team: "Quality & Safety", allocation: 84, detail: "Compliance review due · leave request awaiting review", tone: "amber" as const },
];

const capacity = [68, 74, 62, 57, 71, 78, 82];

export default function HumanResourcesUiDemo() {
  const [activeNav, setActiveNav] = useState("Workforce pulse");
  const [personId, setPersonId] = useState("maria");
  const [note, setNote] = useState("This concept keeps workforce coverage and pending people decisions ahead of dense reports.");
  const person = useMemo(() => people.find((item) => item.id === personId) ?? people[0], [personId]);

  return (
    <DemoFrame role="Human Resources" title="Workforce clarity." subtitle="A quieter people-operations concept that makes coverage, time away, and near-term staffing decisions easy to scan before opening the full HR workspace." navItems={["Workforce pulse", "Leave review", "People watch"]} activeNav={activeNav} onNavigate={setActiveNav}>
      <View style={demoStyles.metricGrid}>
        <DemoMetric label="ACTIVE WORKFORCE" value="34" detail="28 employees · 6 contractors" tone="green" />
        <DemoMetric label="TIME AWAY" value="3" detail="in the next seven days" tone="amber" />
        <DemoMetric label="COVERAGE RISKS" value="2" detail="teams below preferred cover" tone="orange" />
      </View>

      <View style={demoStyles.split}>
        <View style={demoStyles.main}>
          <DemoSection title="NEXT 7 DAYS · CAPACITY" action="VIEW PLANNING" onAction={() => { setActiveNav("Workforce pulse"); setNote("Planning direction selected. The final production view can retain only this light capacity strip in the first viewport."); }}>
            <View style={demoStyles.capacityStrip}>{capacity.map((value, index) => <View key={`${value}-${index}`} style={demoStyles.capacityDay}><View style={demoStyles.capacityColumn}><View style={[demoStyles.capacityFill, { height: `${value}%` as `${number}%` }]} /></View><Text style={demoStyles.capacityLabel}>{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][index]}</Text></View>)}</View>
            <View style={demoStyles.activeNote}><Text style={demoStyles.activeNoteText}>Thursday is the lowest coverage point. Electrical and Quality & Safety require review before new assignments are confirmed.</Text></View>
          </DemoSection>
          <DemoSection title="PENDING PEOPLE DECISIONS" action="OPEN LEAVE REVIEW" onAction={() => { setActiveNav("Leave review"); setNote("Leave review selected. This design keeps pending decisions in one concise prioritized queue."); }}>
            <View style={demoStyles.attentionRow}><View style={demoStyles.rowTop}><Text style={demoStyles.rowTitle}>2 leave requests need a decision</Text><DemoTag label="PENDING" tone="amber" /></View><Text style={demoStyles.rowMeta}>Electrical and Quality & Safety · decision window closes Friday</Text></View>
            <View style={demoStyles.attentionRow}><View style={demoStyles.rowTop}><Text style={demoStyles.rowTitle}>One contractor extension to review</Text><DemoTag label="THIS WEEK" tone="orange" /></View><Text style={demoStyles.rowMeta}>Civil / Structural · coverage handoff scheduled Tuesday</Text></View>
          </DemoSection>
        </View>

        <View style={demoStyles.side}>
          <DemoSection title="PEOPLE WATCH" action="VIEW ALL" onAction={() => { setActiveNav("People watch"); setNote("People Watch selected. A person context card replaces a dense table in the first viewport."); }}>
            {people.map((item) => <Pressable key={item.id} onPress={() => { setPersonId(item.id); setNote(`${item.name} is now the people focus.`); }} style={({ pressed }) => [demoStyles.attentionRow, person.id === item.id && demoStyles.personSelected, pressed && { opacity: 0.72 }]}><View style={demoStyles.rowTop}><Text style={demoStyles.rowTitle}>{item.name}</Text><DemoTag label={`${item.allocation}%`} tone={item.tone} /></View><Text style={demoStyles.rowMeta}>{item.role} · {item.team}</Text></Pressable>)}
          </DemoSection>
          <View style={demoStyles.personContext}><Text style={demoStyles.personName}>{person.name}</Text><Text style={demoStyles.personMeta}>{person.role} · {person.team}</Text><DemoBar value={person.allocation} tone={person.tone === "green" ? "green" : "amber"} /><Text style={demoStyles.personMeta}>{person.allocation}% current allocation · {person.detail}</Text><DemoButton label="OPEN PEOPLE CONTEXT" onPress={() => setNote(`${person.name} remains selected in this local prototype. No personnel profile is opened.`)} muted /></View>
          <View style={demoStyles.activeNote}><Text style={demoStyles.activeNoteText}>{note}</Text></View>
        </View>
      </View>
    </DemoFrame>
  );
}
