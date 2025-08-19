// src/shared/substitutions.ts
export type SubsMap = Record<string, string[]>;
export type AvailabilityCheck = (appName: string) => boolean;

/**
 * Resolve a desired app list into an available list using ordered substitutes.
 * - Preserves order
 * - Avoids duplicates
 * - Skips apps with no available primary/subs
 */
export function resolveAppsWithSubstitutions(
  desiredApps: string[],
  subs: SubsMap,
  isAvailable: AvailabilityCheck
): string[] {
  const chosen: string[] = [];
  const seen = new Set<string>();

  for (const app of desiredApps) {
    const pick = pickAvailable(app, subs, isAvailable, seen);
    if (pick) {
      chosen.push(pick);
      seen.add(pick);
    }
  }
  return chosen;
}

function pickAvailable(
  primary: string,
  subs: SubsMap,
  isAvailable: (a: string) => boolean,
  seen: Set<string>
): string | null {
  if (isAvailable(primary) && !seen.has(primary)) return primary;
  for (const alt of subs[primary] ?? []) {
    if (isAvailable(alt) && !seen.has(alt)) return alt;
  }
  return null;
}

/** Optional: tell the UI if any substitutions occurred */
export function diffSubstitutions(original: string[], resolved: string[]) {
  const changes: Array<{ from: string; to: string }> = [];
  for (let i = 0; i < Math.max(original.length, resolved.length); i++) {
    if (original[i] && resolved[i] && original[i] !== resolved[i]) {
      changes.push({ from: original[i], to: resolved[i] });
    }
  }
  return changes;
}
