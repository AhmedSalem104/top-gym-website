import { describe, expect, it } from 'vitest';
import { couponWhatsAppUrl } from '../../src/scripts/challenge-coupon';

describe('coupon WhatsApp action', () => {
  it('opens the verified gym contact with a safely encoded personalized message', () => {
    const url = new URL(
      couponWhatsAppUrl(
        '+20 10 1581 9700',
        'الاسم أحمد، الهاتف 01015819700، خصم 30%، كوبون TOP-ABC',
      ),
    );
    expect(url.origin + url.pathname).toBe('https://wa.me/201015819700');
    expect(url.searchParams.get('text')).toContain('الاسم أحمد');
    expect(url.searchParams.get('text')).toContain('خصم 30%');
    expect(url.searchParams.get('text')).toContain('TOP-ABC');
  });
});
