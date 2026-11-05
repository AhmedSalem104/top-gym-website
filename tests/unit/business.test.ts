import { describe, expect, it } from 'vitest';
import { business, durationIds } from '../../src/config/business';
import { durations, money, translations } from '../../src/i18n';
describe('Official PDF price transcription, 2026-11-05', () => {
  it('matches every price in the independently transcribed PDF fixture', () => {
    expect(
      business.memberships.map((plan) => durationIds.map((duration) => plan.prices[duration])),
    ).toEqual([
      [180, 350, 700, 1050, 2100, 4200],
      [200, 400, 800, 1200, 2400, 4800],
    ]);
    expect(durations.twoMonths).toEqual({ ar: 'شهرين', en: '2 months' });
    expect(durations.halfMonth).toEqual({ ar: 'نص شهر', en: 'Half month' });
  });
  it('uses supplied phone and external contact destinations', () => {
    expect(business.contacts.map((contact) => contact.phone)).toEqual([
      '+201015819700',
      '+201005376843',
    ]);
    expect(business.links).toEqual({
      facebook: 'https://www.facebook.com/share/1Dz61Wmkjc/?mibextid=wwXIfr',
      maps: 'https://maps.app.goo.gl/X6jyrHU7x6e5j8vv6?g_st=ic',
      whatsappGroup: 'https://chat.whatsapp.com/HYYB9EXYHv46YBFSLq5zSu?mode=gi_t',
    });
  });
  it('localizes both currencies and all copy without dropping translation keys', () => {
    expect(Object.keys(translations.ar).sort()).toEqual(Object.keys(translations.en).sort());
    expect(money(350, 'ar')).toContain('٣٥٠');
    expect(money(350, 'en')).toContain('350');
    expect(Object.values(translations.ar).every(Boolean)).toBe(true);
  });
});
