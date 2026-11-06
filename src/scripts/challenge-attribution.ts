// First-party, session-scoped event deduplication. No advertising identifiers.
export function challengeEvent(event: 'challenge_viewed' | 'challenge_opened') {
  let key: string = crypto.randomUUID();
  try {
    key = sessionStorage.getItem('tg-challenge-event') || key;
    sessionStorage.setItem('tg-challenge-event', key);
  } catch {
    /* Optional storage. */
  }
  return { event, key, attribution: challengeAttribution() };
}
export function challengeAttribution() {
  const p = new URLSearchParams(location.search);
  const clean = (name: string, max: number) =>
    (p.get(name) || '').replace(/[\p{Cc}\p{Cf}]/gu, '').slice(0, max);
  return {
    source: clean('utm_source', 120),
    medium: clean('utm_medium', 120),
    campaign: clean('utm_campaign', 160),
    content: clean('utm_content', 160),
    landing: location.pathname,
    entry: 'floating',
  };
}
