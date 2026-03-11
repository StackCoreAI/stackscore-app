import { describe, it, expect } from "vitest";
import { selectVisibleApps } from "../../shared/visibility";

describe("visibility lock", () => {
  it("shows 1 app when locked; up to 7 when unlocked", () => {
    const apps = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    expect(selectVisibleApps(apps, false)).toHaveLength(1);
    expect(selectVisibleApps(apps, true).length).toBeLessThanOrEqual(7);
  });
});

