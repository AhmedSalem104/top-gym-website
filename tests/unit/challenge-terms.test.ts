import { describe, expect, it } from 'vitest';
import { localizedChallengeTerms } from '../../src/scripts/challenge-terms';

describe('localized challenge coupon terms', () => {
  it('uses the Arabic display copy when production policy text is question marks', () => {
    const result = localizedChallengeTerms(
      { ar: '?????? ??? 30 ????? ??? ????? ?????', en: 'Valid for 30 days.' },
      'ar',
    );
    expect(result).toContain('30 يومًا');
    expect(result).toMatch(/[\u0600-\u06ff]/u);
    expect(result).not.toContain('????');
  });

  it('preserves valid policy copy in both languages', () => {
    expect(localizedChallengeTerms({ ar: 'شروط كوبون سليمة', en: 'Valid terms.' }, 'ar')).toBe(
      'شروط كوبون سليمة',
    );
    expect(localizedChallengeTerms({ ar: 'شروط كوبون سليمة', en: 'Valid terms.' }, 'en')).toBe(
      'Valid terms.',
    );
  });
});
