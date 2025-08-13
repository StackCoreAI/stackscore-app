// shared/visibility.ts
export type VisibilityInput = {
    hasAccess: boolean;           // paywall flag
    unlockedIndex: number;        // from AdvisorResponse.plan.unlocked_app_index
    appsCount: number;            // actual number of rows the plan exposes
  };
  
  export function visibleCap({ hasAccess }: VisibilityInput): number {
    // Central place to change the rule later (e.g., trial shows 2)
    return hasAccess ? 6 : 1;
  }
  
  /** Returns an array of “row states” the UI can render without extra logic. */
  export function computeRowStates({ hasAccess, unlockedIndex, appsCount }: VisibilityInput) {
    const cap = visibleCap({ hasAccess, unlockedIndex, appsCount });
    const states: ("unlocked" | "locked")[] = [];
    for (let i = 0; i < appsCount; i++) {
      states.push(i <= unlockedIndex || i < cap ? "unlocked" : "locked");
    }
    return states;
  }
  