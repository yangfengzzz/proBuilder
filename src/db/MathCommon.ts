import { MathUtil } from "oasis-engine";

export class MathCommon {
  public static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * MathUtil.clamp(t, 0, 1);
  }
}
