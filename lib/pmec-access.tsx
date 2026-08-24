import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

export type PmecControlRole = "pm" | "hr";
export type PmecPermission = "delivery" | "assign" | "capacity" | "hoursApprove" | "hoursRead" | "people" | "leaveReview";

const STORAGE_KEY = "lumen.pmec.control-role.v1";
export const permissionMap: Record<PmecControlRole, PmecPermission[]> = {
  pm: ["delivery", "assign", "capacity", "hoursApprove", "hoursRead"],
  hr: ["hoursRead", "people", "leaveReview"],
};
export const roleCan = (role: PmecControlRole, permission: PmecPermission) => permissionMap[role].includes(permission);
type AccessContextValue = { role: PmecControlRole; ready: boolean; setRole: (role: PmecControlRole) => void; can: (permission: PmecPermission) => boolean; label: string; description: string };
const AccessContext = createContext<AccessContextValue | null>(null);

export function PmecAccessProvider({ children }: PropsWithChildren) {
  const [role, setRoleState] = useState<PmecControlRole>("pm"); const [ready, setReady] = useState(false);
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value === "pm" || value === "hr") setRoleState(value); }).finally(() => setReady(true)); }, []);
  const setRole = (next: PmecControlRole) => { setRoleState(next); void AsyncStorage.setItem(STORAGE_KEY, next); };
  const value = useMemo<AccessContextValue>(() => ({ role, ready, setRole, can: (permission) => roleCan(role, permission), label: role === "pm" ? "PROJECT MANAGER" : "HUMAN RESOURCES", description: role === "pm" ? "Delivery, assignment, capacity and hours approval" : "People, leave and workforce-hours oversight" }), [ready, role]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function usePmecAccess() { const context = useContext(AccessContext); if (!context) throw new Error("usePmecAccess must be used inside PmecAccessProvider"); return context; }
