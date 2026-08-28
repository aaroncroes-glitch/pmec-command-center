import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DemoBar, DemoButton, DemoFrame, DemoMetric, DemoSection, DemoTag, demoStyles } from "@/components/pmec-desktop-demo-kit";

const projects = [
  { id: "coastal", title: "Coastal Substation Retrofit", client: "WEB Aruba N.V.", progress: 40, burn: 81, budget: "AWG 149,520", tone: "amber" as const, status: "Budget watch", milestone: "Switchgear delivery · 31 Jul", owner: "Elmar N.V." },
  { id: "water", title: "Municipal Water Upgrade", client: "Greater Cairo Water", progress: 36, burn: 17, budget: "EGP 725,000", tone: "green" as const, status: "On track", milestone: "Design approval · 20 Dec", owner: "Nour El-Sayed" },
  { id: "hospital", title: "Hospital Wing Retrofit", client: "Hospital Punta Pacífica", progress: 98, burn: 89, budget: "USD 275,305", tone: "amber" as const, status: "Budget watch", milestone: "Close-out pack · 15 May", owner: "Luis Herrera" },
];

export default function ProjectManagerUiDemo() {
  const [activeNav, setActiveNav] = useState("Delivery pulse");
  const [projectId, setProjectId] = useState("coastal");
  const [note, setNote] = useState("The first viewport is intentionally limited to today’s decisions and one accountable project focus.");
  const project = useMemo(() => projects.find((item) => item.id === projectId) ?? projects[0], [projectId]);

  return (
    <DemoFrame role="Project Manager" title="Delivery pulse." subtitle="A calmer desktop concept for seeing today’s delivery decisions, one accountable project focus, and the signals that need action—without opening three dashboards at once." navItems={["Delivery pulse", "Portfolio", "Decisions"]} activeNav={activeNav} onNavigate={setActiveNav}>
      <View style={demoStyles.metricGrid}>
        <DemoMetric label="ON TRACK" value="8" detail="of 11 active projects" tone="green" />
        <DemoMetric label="NEEDS ATTENTION" value="3" detail="budget or schedule signal" tone="amber" />
        <DemoMetric label="FORECAST VARIANCE" value="+4.8%" detail="across the live plan" tone="orange" />
      </View>

      <View style={demoStyles.split}>
        <View style={demoStyles.main}>
          <DemoSection title="TODAY’S DECISIONS" action="OPEN DECISIONS" onAction={() => { setActiveNav("Decisions"); setNote("Decision view selected. The approved direction keeps critical approvals in one compact queue."); }}>
            {projects.map((item) => <Pressable key={item.id} onPress={() => { setProjectId(item.id); setNote(`${item.title} is now the single project focus.`); }} style={({ pressed }) => [demoStyles.attentionRow, pressed && { opacity: 0.72 }]}><View style={demoStyles.rowTop}><Text style={demoStyles.rowTitle}>{item.title}</Text><DemoTag label={item.status.toUpperCase()} tone={item.tone} /></View><Text style={demoStyles.rowMeta}>{item.client} · {item.milestone}</Text><DemoBar value={item.progress} tone={item.tone === "green" ? "green" : "orange"} /></Pressable>)}
          </DemoSection>
          <View style={demoStyles.activeNote}><Text style={demoStyles.activeNoteText}>{note}</Text></View>
        </View>

        <View style={demoStyles.side}>
          <View style={demoStyles.focusCard}>
            <Text style={demoStyles.focusEyebrow}>PROJECT FOCUS · {activeNav.toUpperCase()}</Text>
            <Text style={demoStyles.focusTitle}>{project.title}</Text>
            <Text style={demoStyles.focusCopy}>{project.client} · Accountable: {project.owner}</Text>
            <View><Text style={demoStyles.focusMetric}>{project.progress}%</Text><Text style={demoStyles.focusMetricLabel}>DELIVERY COMPLETE</Text><View style={demoStyles.lightBarTrack}><View style={[demoStyles.lightBarFill, { width: `${project.progress}%` as `${number}%` }]} /></View></View>
            <View style={demoStyles.rowTop}><View><Text style={demoStyles.focusMetric}>{project.burn}%</Text><Text style={demoStyles.focusMetricLabel}>BUDGET BURN</Text></View><DemoTag label={project.status.toUpperCase()} tone={project.tone} /></View>
            <Text style={demoStyles.focusCopy}>{project.budget} recorded · next: {project.milestone}</Text>
            <View style={demoStyles.milestoneRow}><View style={demoStyles.milestoneDot} /><View style={demoStyles.milestoneLine} /><Text style={demoStyles.milestoneLabel}>Design</Text><View style={demoStyles.milestoneLine} /><View style={demoStyles.milestoneDot} /></View>
            <DemoButton label="OPEN PROJECT FOCUS" onPress={() => setNote(`${project.title} is the retained focus. This isolated demo does not open the live Project Tracker.`)} />
          </View>
          <View style={demoStyles.insight}><Text style={demoStyles.insightValue}>14</Text><Text style={demoStyles.insightLabel}>work packages due within the next 14 days</Text></View>
        </View>
      </View>
    </DemoFrame>
  );
}
