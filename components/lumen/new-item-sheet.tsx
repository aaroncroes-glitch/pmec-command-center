import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { haptic } from "@/lib/haptics";
import { useLumen } from "@/lib/lumen-workspace";
import type { Recurrence, TaskPriority } from "@/lib/lumen-types";
import { formatCompactDate, normalizeTags } from "@/lib/lumen-utils";
import { useMotionPreference } from "@/hooks/use-motion-preference";

type Props = { visible: boolean; mode: "task" | "project"; defaultProjectId?: string; onClose: () => void };
const priorities: TaskPriority[] = ["high", "medium", "low"];
const recurrences: Recurrence[] = ["none", "daily", "weekly", "monthly"];

export function NewItemSheet({ visible, mode, defaultProjectId, onClose }: Props) {
  const { activeDate, addProject, addTask, palette, projects } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const reduceMotion = useMotionPreference();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [tagsInput, setTagsInput] = useState("");
  const [needsReminder, setNeedsReminder] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(""); setDescription(""); setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setPriority("medium"); setRecurrence("none"); setTagsInput(""); setNeedsReminder(false);
  }, [defaultProjectId, projects, visible]);

  const save = () => {
    if (!title.trim()) return;
    if (mode === "task") {
      if (!projectId) return;
      const reminderDate = new Date(`${activeDate}T09:00:00`);
      addTask({ title, projectId, priority, dueDate: activeDate, tags: normalizeTags(tagsInput.split(",")), recurrence, reminderAt: needsReminder ? reminderDate.toISOString() : undefined });
    } else {
      addProject({ name: title, description });
    }
    haptic.light(); onClose();
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(160)} exiting={reduceMotion ? undefined : FadeOut.duration(130)} style={styles.backdrop}>
        <Pressable accessibilityLabel="Close composer" onPress={onClose} style={styles.backdropTouch} />
        <Animated.View entering={reduceMotion ? undefined : SlideInDown.springify().damping(24).stiffness(190)} exiting={reduceMotion ? undefined : SlideOutDown.duration(180)} style={styles.sheet}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.eyebrow}>{mode === "task" ? "A CLEAR NEXT STEP" : "A NEW BODY OF WORK"}</Text>
              <Pressable accessibilityLabel="Close composer" onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.title}>{mode === "task" ? "NEW TASK" : "NEW PROJECT"}</Text>
            <TextInput accessibilityLabel={mode === "task" ? "Task title" : "Project name"} autoFocus multiline onChangeText={setTitle} placeholder={mode === "task" ? "What needs your attention?" : "Name this project"} placeholderTextColor={palette.muted} returnKeyType="done" style={styles.titleInput} value={title} />
            {mode === "task" ? (
              <>
                <Text style={styles.fieldLabel}>PROJECT</Text>
                <ScrollView contentContainerStyle={styles.chipList} horizontal showsHorizontalScrollIndicator={false}>
                  {projects.filter((project) => project.status !== "complete").map((project) => <Pressable accessibilityState={{ selected: projectId === project.id }} key={project.id} onPress={() => { haptic.selection(); setProjectId(project.id); }} style={({ pressed }) => [styles.chip, projectId === project.id && styles.chipActive, pressed && styles.pressed]}><View style={[styles.chipDot, { backgroundColor: project.color }]} /><Text style={[styles.chipText, projectId === project.id && styles.chipTextActive]}>{project.name}</Text></Pressable>)}
                </ScrollView>
                <Text style={styles.fieldLabel}>PRIORITY</Text>
                <View style={styles.priorityGroup}>{priorities.map((item) => <Pressable accessibilityState={{ selected: priority === item }} key={item} onPress={() => { haptic.selection(); setPriority(item); }} style={({ pressed }) => [styles.priorityChip, priority === item && styles.priorityChipActive, pressed && styles.pressed]}><Text style={[styles.priorityText, priority === item && styles.priorityTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>
                <Text style={styles.fieldLabel}>REPEATS</Text>
                <ScrollView contentContainerStyle={styles.chipList} horizontal showsHorizontalScrollIndicator={false}>{recurrences.map((item) => <Pressable accessibilityState={{ selected: recurrence === item }} key={item} onPress={() => { haptic.selection(); setRecurrence(item); }} style={({ pressed }) => [styles.chip, recurrence === item && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, recurrence === item && styles.chipTextActive]}>{item === "none" ? "DOES NOT REPEAT" : item.toUpperCase()}</Text></Pressable>)}</ScrollView>
                <Text style={styles.fieldLabel}>TAGS</Text>
                <TextInput accessibilityLabel="Custom tags, comma separated" autoCapitalize="none" onChangeText={setTagsInput} placeholder="client, deep work" placeholderTextColor={palette.muted} style={styles.tagInput} value={tagsInput} />
                <Text style={styles.fieldLabel}>REMINDER</Text>
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: needsReminder }} onPress={() => { haptic.selection(); setNeedsReminder((current) => !current); }} style={({ pressed }) => [styles.reminderRow, needsReminder && styles.reminderRowActive, pressed && styles.pressed]}><View><Text style={[styles.reminderTitle, needsReminder && styles.reminderTitleActive]}>REMIND ME AT 09:00</Text><Text style={styles.reminderDescription}>A local alert for the scheduled day</Text></View><View style={[styles.toggleDot, needsReminder && styles.toggleDotActive]}>{needsReminder ? <Text style={styles.toggleCheck}>✓</Text> : null}</View></Pressable>
                <Text style={styles.scheduled}>SCHEDULED FOR {formatCompactDate(activeDate).toUpperCase()}</Text>
              </>
            ) : <TextInput accessibilityLabel="Project description" multiline onChangeText={setDescription} placeholder="A short intention for this work" placeholderTextColor={palette.muted} style={styles.descriptionInput} value={description} />}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !title.trim() }} disabled={!title.trim()} onPress={save} style={({ pressed }) => [styles.saveButton, !title.trim() && styles.saveDisabled, pressed && styles.savePressed]}><Text style={styles.saveText}>{mode === "task" ? "ADD TASK" : "CREATE PROJECT"}</Text></Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({ backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.34)" }, backdropTouch: { ...StyleSheet.absoluteFillObject }, sheet: { backgroundColor: palette.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "91%", minHeight: 430, paddingHorizontal: 22, paddingBottom: 30, paddingTop: 10 }, handle: { alignSelf: "center", backgroundColor: palette.border, borderRadius: 2, height: 4, marginBottom: 20, width: 38 }, sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, eyebrow: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, close: { alignItems: "center", backgroundColor: palette.surfaceStrong, borderRadius: 18, height: 36, justifyContent: "center", width: 36 }, closeText: { color: palette.foreground, fontSize: 25, fontWeight: "300", lineHeight: 29 }, title: { color: palette.foreground, fontSize: 34, fontWeight: "900", letterSpacing: -1.5, marginTop: 18 }, titleInput: { borderBottomColor: palette.border, borderBottomWidth: 1, color: palette.foreground, fontSize: 18, fontWeight: "600", lineHeight: 25, marginTop: 14, minHeight: 58, paddingBottom: 13, paddingTop: 0 }, fieldLabel: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 20 }, chipList: { gap: 8, paddingTop: 10 }, chip: { alignItems: "center", borderColor: palette.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 36, paddingHorizontal: 12 }, chipActive: { backgroundColor: palette.inverse, borderColor: palette.inverse }, chipDot: { borderRadius: 4, height: 8, width: 8 }, chipText: { color: palette.foreground, fontSize: 12, fontWeight: "700" }, chipTextActive: { color: palette.inverseText }, priorityGroup: { flexDirection: "row", gap: 8, marginTop: 10 }, priorityChip: { alignItems: "center", borderColor: palette.border, borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 34, minWidth: 72, paddingHorizontal: 10 }, priorityChipActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent }, priorityText: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 }, priorityTextActive: { color: palette.accentText }, tagInput: { borderBottomColor: palette.border, borderBottomWidth: 1, color: palette.foreground, fontSize: 15, minHeight: 42, paddingBottom: 8, paddingTop: 0 }, reminderRow: { alignItems: "center", borderColor: palette.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 10, minHeight: 59, paddingHorizontal: 13 }, reminderRowActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent }, reminderTitle: { color: palette.foreground, fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, reminderTitleActive: { color: palette.accentText }, reminderDescription: { color: palette.muted, fontSize: 11, marginTop: 3 }, toggleDot: { alignItems: "center", borderColor: palette.border, borderRadius: 10, borderWidth: 1, height: 20, justifyContent: "center", width: 20 }, toggleDotActive: { backgroundColor: palette.accent, borderColor: palette.accent }, toggleCheck: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, scheduled: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 18 }, descriptionInput: { borderBottomColor: palette.border, borderBottomWidth: 1, color: palette.foreground, fontSize: 16, lineHeight: 22, marginTop: 20, minHeight: 84, paddingBottom: 12, paddingTop: 0, textAlignVertical: "top" }, saveButton: { alignItems: "center", backgroundColor: palette.accent, borderRadius: 18, justifyContent: "center", marginTop: 30, minHeight: 58 }, saveDisabled: { backgroundColor: palette.surfaceStrong }, savePressed: { opacity: 0.88, transform: [{ scale: 0.975 }] }, saveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.1 }, pressed: { opacity: 0.64 } });
