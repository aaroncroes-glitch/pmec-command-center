import Constants from "expo-constants";
import { useAuth, useClerk, useUser } from "@clerk/expo";

import { hasUsableClerkPublishableKey } from "@/lib/pmec-clerk-config";

// Whether a ClerkProvider is mounted is decided once, in app/_layout.tsx, from the
// same publishable key this reads. It cannot change while the app is running.
export const clerkEnabled = hasUsableClerkPublishableKey(
  hasUsableClerkPublishableKey(Constants.expoConfig?.extra?.clerkPublishableKey)
    ? Constants.expoConfig?.extra?.clerkPublishableKey
    : process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const signedOut = { isLoaded: true, isSignedIn: false, getToken: async () => null } as const;
const noUser = { isLoaded: true, isSignedIn: false, user: null };

// Screens hide sign-in when Clerk is off (see `clerkEnabled`). Should one be missed, a
// warning beats what throwing here did: a full-page crash on click in dev and previews.
const unavailable = () => {
  console.warn("Sign-in is not configured in this build.");
};
const noClerk = { openSignIn: unavailable, signOut: async () => {} };

// Each implementation is picked once, when this module loads, so every render calls the
// same hook. Branching inside the hooks was equally safe for that reason, but it reads as
// a conditional hook call, which react-hooks/rules-of-hooks rightly rejects.
const useAuthImpl = clerkEnabled ? useAuth : () => signedOut;
const useUserImpl = clerkEnabled ? useUser : () => noUser;
const useClerkImpl = clerkEnabled ? useClerk : () => noClerk;

/**
 * Clerk's hooks throw when no ClerkProvider is above them. Without a publishable
 * key the app deliberately runs provider-less (local showcase, first clone, CI),
 * so these report a signed-out principal instead of crashing the tree. Failing
 * closed means every `isSignedIn === true` authorization gate stays shut.
 */
export function useOptionalAuth() {
  return useAuthImpl();
}

export function useOptionalUser() {
  return useUserImpl();
}

export function useOptionalClerk() {
  return useClerkImpl();
}
