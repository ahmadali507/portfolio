import type { Tier } from './types';

/** Pixel-ratio steps, from sharpest to cheapest. */
const DPR_STEPS = [2, 1.75, 1.5, 1.25, 1] as const;
const WINDOW = 60;
/** 16.6 ms is the 60 fps frame. A small allowance absorbs vsync jitter. */
const BUDGET_MS = 16.6;
const SLOW_MS = BUDGET_MS * 1.12;
/** ARCHITECTURE.md section 8: drop one tier when the first two seconds run slower than this. */
const TIER_DROP_MS = 22;

/**
 * Adaptive quality. Records the interval between consecutive rendered frames and lowers the
 * pixel ratio one step whenever the median of the last 60 exceeds the 16.6 ms budget.
 * It steps back up at most twice, and only after a long run well inside budget, so it cannot oscillate.
 */
export class Quality {
  private readonly samples = new Float32Array(WINDOW);
  private readonly sorted = new Float32Array(WINDOW);
  private count = 0;
  private cursor = 0;
  private fastRuns = 0;
  private upgrades = 0;
  private step: number;
  private readonly maxStep: number;
  private startupMs = 0;
  private startupFrames = 0;
  private startupDone = false;
  private warmup = 90;
  tier: Tier = 1;
  /** Set when the pixel ratio or tier changed and the Engine must apply it. */
  changed = false;

  constructor(deviceRatio: number, coarsePointer: boolean) {
    const cap = Math.min(deviceRatio, coarsePointer ? 1.5 : 2);
    let s = DPR_STEPS.findIndex((v) => v <= cap);
    if (s < 0) s = DPR_STEPS.length - 1;
    this.step = s;
    this.maxStep = s;
  }

  get pixelRatio(): number {
    return DPR_STEPS[this.step] ?? 1;
  }

  /** Feed the interval in ms between two consecutive rendered frames. */
  sample(ms: number): void {
    if (ms <= 0 || ms > 250) return; // tab switches and stalls are not frame cost
    // Shader compilation and first uploads make the opening frames slow on any machine.
    // Let them pass before judging the device.
    if (this.warmup > 0) {
      this.warmup--;
      return;
    }
    if (!this.startupDone) {
      this.startupMs += ms;
      this.startupFrames++;
      if (this.startupMs >= 2000) {
        this.startupDone = true;
        if (this.startupMs / this.startupFrames > TIER_DROP_MS && this.tier === 1) {
          this.tier = 2;
          this.step = Math.min(this.step + 1, DPR_STEPS.length - 1);
          this.changed = true;
          this.reset();
          return;
        }
      }
    }
    this.samples[this.cursor] = ms;
    this.cursor = (this.cursor + 1) % WINDOW;
    if (this.count < WINDOW) {
      this.count++;
      return;
    }
    const median = this.median();
    if (median > SLOW_MS && this.step < DPR_STEPS.length - 1) {
      this.step++;
      this.changed = true;
      this.fastRuns = 0;
      this.reset();
    } else if (median < BUDGET_MS * 0.75 && this.step > this.maxStep && this.upgrades < 2) {
      if (++this.fastRuns >= 4) {
        this.step--;
        this.upgrades++;
        this.changed = true;
        this.fastRuns = 0;
        this.reset();
      }
    }
  }

  /** Last measured median frame interval, for the stats overlay. */
  get medianMs(): number {
    return this.count ? this.median() : 0;
  }

  private median(): number {
    this.sorted.set(this.samples);
    this.sorted.sort();
    return this.sorted[WINDOW >> 1] ?? 0;
  }

  private reset(): void {
    this.count = 0;
    this.cursor = 0;
  }
}
