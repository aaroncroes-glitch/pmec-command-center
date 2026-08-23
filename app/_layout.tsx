import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LumenWorkspaceProvider } from "@/lib/lumen-workspace";
export default function RootLayout() { return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><LumenWorkspaceProvider><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="(tabs)" /><Stack.Screen name="project/[id]" /></Stack></LumenWorkspaceProvider></SafeAreaProvider></GestureHandlerRootView>; }
