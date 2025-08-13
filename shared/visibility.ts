// shared/visibility.ts

export type VisibilityInput = {
  hasAccess: boolean;     // paywall flag
  unlockedIndex: number;  // 0-based index of the last explicitly unlocked row (when user has access)
  appsCount: number;      // total rows available in the plan
};

// Central knobs
const MAX_WHEN_OPEN = 7;     // show up to 7 apps when unlocked
const MIN_WHEN_LOCKED = 1;   // show exactly 1 app when locked

export function visibleCap({ hasAccess }: VisibilityInput): number {
  return hasAccess ? MAX_WHEN_OPEN : MIN_WHEN_LOCKED;
}

/**
 * Returns an array of "row states" the UI can render without extra logic.
 * - When locked: ONLY index 0 is "unlocked"; all others "locked" (regardless of unlockedIndex).
 * - When unlocked: rows up to max(unlockedIndex, cap-1) are "unlocked".
 */
export function computeRowStates({
  hasAccess,
  unlockedIndex,
  appsCount,
}: VisibilityInput) {
  const cap = visibleCap({ hasAccess, unlockedIndex, appsCount });

  // Normalize inputs
  const last = Math.max(0, appsCount - 1);
  const safeUnlockedIndex = Number.isFinite(unlockedIndex) ? unlockedIndex : -1;

  // Determine the last index that should render as "unlocked"
  const unlockedThrough = hasAccess
    ? Math.min(last, Math.max(cap - 1, safeUnlockedIndex)) // open: honor either cap or explicit unlocks
    : Math.min(last, 0);                                   // locked: force ONLY first row visible

  const states: ("unlocked" | "locked")[] = [];
  for (let i = 0; i < appsCount; i++) {
    states.push(i <= unlockedThrough ? "unlocked" : "locked");
  }
  return states;
}

// Convenience helper for UIs/tests: slice the list to only the visible rows.
export function selectVisibleApps<T>(
  apps: T[],
  hasAccess: boolean,
  unlockedIndex = -1, // Ignored while locked; when open, lets you unlock beyond the cap if needed
): T[] {
  const total = Array.isArray(apps) ? apps.length : 0;
  const states = computeRowStates({ hasAccess, unlockedIndex, appsCount: total });
  return (apps ?? []).filter((_, i) => states[i] === "unlocked");
}

  