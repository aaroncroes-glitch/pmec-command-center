import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";
import { useLumen } from "@/lib/lumen-workspace";
export function useMotionPreference() { const { motionMode } = useLumen(); const [systemReducedMotion, setSystemReducedMotion] = useState(false); useEffect(() => { void AccessibilityInfo.isReduceMotionEnabled().then(setSystemReducedMotion); const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setSystemReducedMotion); return () => subscription.remove(); }, []); return motionMode === "reduced" || systemReducedMotion; }
