import { describe, expect, it } from 'vitest';
import {
  motion,
  motionDuration,
  motionFrames,
  staggerDelay,
  type MotionTransition,
} from '../../src/config/motion';

describe('Motion safety budget', () => {
  it('caps large lists and rejects negative stagger delays', () => {
    const delays = Array.from({ length: 100 }, (_, index) => staggerDelay(index));
    expect(delays.every((value) => value >= 0 && value <= 320)).toBe(true);
    expect(staggerDelay(-2)).toBe(0);
    expect(staggerDelay(1) - staggerDelay(0)).toBeGreaterThanOrEqual(70);
    expect(motion.delayCap).toBeLessThanOrEqual(320);
  });
  it('only animates composite properties and stays within the timing budget', () => {
    const variants: MotionTransition[] = [
      'reveal',
      'heading',
      'image',
      'hero',
      'hero-image',
      'fade',
      'enter',
      'exit',
      'feedback',
      'footer',
    ];
    for (const variant of variants) {
      expect(
        motionFrames(variant).every((frame) =>
          Object.keys(frame).every((key) => ['opacity', 'transform'].includes(key)),
        ),
      ).toBe(true);
      expect(motionDuration(variant)).toBeLessThanOrEqual(700);
      expect(motionDuration(variant)).toBeGreaterThan(0);
    }
  });
  it('never hides the LCP heading or hero image and ends without transforms', () => {
    for (const variant of ['hero', 'hero-image'] as const) {
      expect(
        motionFrames(variant).every((frame) => frame.opacity === undefined || frame.opacity === 1),
      ).toBe(true);
    }
    expect(motionFrames('reveal').at(-1)).toEqual({ opacity: 1, transform: 'none' });
  });
});
