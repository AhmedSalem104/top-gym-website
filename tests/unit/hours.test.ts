import { describe, it, expect } from 'vitest';
import { getCairoStatus } from '../../src/utils/hours';
describe('Africa/Cairo operating hours with exclusive closing boundary', () => {
  it.each([
    ['2026-11-07T10:59:00Z', 6, false],
    ['2026-11-07T11:00:00Z', 6, true],
    ['2026-11-07T21:59:59Z', 6, true],
    ['2026-11-07T22:00:00Z', 0, false],
    ['2026-11-06T13:59:59Z', 5, false],
    ['2026-11-06T14:00:00Z', 5, true],
    ['2026-11-06T19:59:59Z', 5, true],
    ['2026-11-06T20:00:00Z', 5, false],
    ['2026-07-04T09:59:00Z', 6, false],
    ['2026-07-04T10:00:00Z', 6, true],
    ['2026-07-04T21:00:00Z', 0, false],
  ])('%s is day %i, open=%s', (iso, day, isOpen) => {
    expect(getCairoStatus(new Date(iso))).toMatchObject({ day, isOpen });
  });
  it('handles Cairo’s repeated hour at the autumn DST boundary', () => {
    expect(getCairoStatus(new Date('2026-10-29T20:30:00Z'))).toMatchObject({
      day: 4,
      isOpen: true,
    });
    expect(getCairoStatus(new Date('2026-10-29T21:30:00Z'))).toMatchObject({
      day: 4,
      isOpen: true,
    });
    expect(getCairoStatus(new Date('2026-10-29T22:00:00Z'))).toMatchObject({
      day: 5,
      isOpen: false,
    });
  });
});
