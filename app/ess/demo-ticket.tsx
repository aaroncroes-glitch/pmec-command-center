import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, useSignIn } from "@clerk/expo";

import { ScreenContainer } from "@/components/screen-container";
import { useLumen } from "@/lib/lumen-workspace";
import { clerkEnabled } from "@/lib/pmec-clerk-optional";
import { showcaseMode } from "@/lib/pmec-showcase";

export default function PmecDemoTicketScreen() {
  // One-time links sign in through Clerk, which the showcase does not load. Clerk's hooks throw
  // without it, so the showcase gets a page that points back to the demo instead.
  return clerkEnabled && !showcaseMode ? <LiveDemoTicket /> : <ShowcaseDemoTicket />;
}

function ShowcaseDemoTicket() {
  const router = useRouter();
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return <ScreenContainer containerClassName={styles.container} edges={["top", "bottom", "left", "right"]}><View style={styles.root}><Text style={styles.kicker}>PMEC / DEMONSTRATION ACCESS</Text><Text style={styles.title}>{"NO LINK\nNEEDED."}</Text><Text style={styles.copy}>This showcase opens without a one-time link. Those links sign in to the live system, which is not part of this demo.</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/demo")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>OPEN THE SHOWCASE</Text></Pressable><Text style={styles.footer}>SHOWCASE DATA ONLY</Text></View></ScreenContainer>;
}

function LiveDemoTicket() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = typeof params.token === "string" ? params.token : undefined;
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const attempted = useRef(false);
  const [state, setState] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Verifying your one-time PMEC demonstration access.");

  useEffect(() => {
    if (Platform.OS === "web" && token) window.history.replaceState({}, "", "/ess/demo-ticket");
  }, [token]);

  useEffect(() => {
    if (!isLoaded || attempted.current) return;
    attempted.current = true;
    if (!token) {
      setState("error");
      setMessage("This demonstration link is incomplete. Request a new one-time link before trying again.");
      return;
    }

    void signIn.create({ strategy: "ticket", ticket: token }).then(async ({ error }) => {
      if (error || signIn.status !== "complete") throw new Error("The one-time demonstration link could not create a session.");
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) throw new Error("The one-time demonstration link could not activate a session.");
      router.replace("/ess/login");
    }).catch(() => {
      setState("error");
      setMessage("This one-time demonstration link has expired, was already used, or could not be verified. Request a fresh link.");
    });
  }, [isLoaded, router, signIn, token]);

  return <ScreenContainer containerClassName={styles.container} edges={["top", "bottom", "left", "right"]}><View style={styles.root}><Text style={styles.kicker}>PMEC / DEMONSTRATION ACCESS</Text><Text style={styles.title}>{state === "working" ? "VERIFYING\nACCESS." : "LINK\nUNAVAILABLE."}</Text><Text style={styles.copy}>{message}</Text>{state === "working" ? <ActivityIndicator color={palette.accent} size="large" style={styles.loader} /> : <Pressable onPress={() => router.replace("/ess/login")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>BACK TO SIGN IN</Text></Pressable>}<Text style={styles.footer}>ONE-TIME ACCESS · SESSION VALIDATED BY CLERK</Text></View></ScreenContainer>;
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({ container: { backgroundColor: palette.background }, root: { flex: 1, justifyContent: "center", paddingHorizontal: 24 }, kicker: { color: palette.accentText, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: palette.foreground, fontSize: 46, fontWeight: "900", letterSpacing: -2, lineHeight: 50, marginTop: 14 }, copy: { color: palette.muted, fontSize: 16, lineHeight: 24, marginTop: 18, maxWidth: 330 }, loader: { marginTop: 32 }, button: { alignItems: "center", backgroundColor: palette.foreground, borderRadius: 18, height: 56, justifyContent: "center", marginTop: 32 }, buttonText: { color: palette.inverseText, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, footer: { bottom: 28, left: 0, color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: .8, position: "absolute", textAlign: "center", width: "100%" }, pressed: { opacity: .86, transform: [{ scale: .98 }] } });
