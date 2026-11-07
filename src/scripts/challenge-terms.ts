import { challengeCopy, type ChallengeLocale } from '../i18n/challenge';

type LocalizedTerms = { ar?: string; en?: string } | undefined;

/** Replace policy text corrupted during deployment with the accurate bilingual display copy. */
export function localizedChallengeTerms(terms: LocalizedTerms, locale: ChallengeLocale): string {
  const value = terms?.[locale]?.trim();
  if (!value) return challengeCopy[locale].couponTermsFallback;

  // Arabic must contain Arabic script and must not contain replacement question-mark runs.
  if (
    locale === 'ar' &&
    (!/[\u0600-\u06ff]/u.test(value) || /\?{2,}/u.test(value) || value.includes('\ufffd'))
  )
    return challengeCopy.ar.couponTermsFallback;

  return value;
}
