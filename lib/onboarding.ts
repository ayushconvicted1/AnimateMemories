import type { UserResource } from "@clerk/types";

/**
 * Marks the current user's first-run guide (quick tour) as finished (skipped
 * or completed).
 *
 * The flag lives in Clerk unsafeMetadata so the guide only shows once per
 * account — on the first registration / first login — and never reappears on
 * later opens, even after reinstalls or on a different device.
 */
export const markOnboardingComplete = async (
  user: UserResource | null | undefined
) => {
  if (!user) return;
  try {
    // unsafeMetadata is what this Clerk version's update() accepts in RN
    // (same pattern as the profile screen); it's merged, not replaced.
    await user.update({
      unsafeMetadata: { onboardingCompleted: true },
    });
  } catch (error) {
    // Non-critical: if the metadata write fails, the device-level flag in
    // TourContext still prevents the guide from reappearing on this install.
    console.log("Failed to mark guide complete (non-critical):", error);
  }
};
