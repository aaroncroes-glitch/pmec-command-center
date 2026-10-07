import { Platform } from "react-native";

/** Hairline figures render only on Expo web. */
export const hairlineWeb = Platform.OS === "web";
