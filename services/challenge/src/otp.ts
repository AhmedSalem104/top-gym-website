import { Fault } from './security.ts';
import type { Config } from './config.ts';
export interface OtpProvider {
  request(phone: string): Promise<void>;
  confirm(phone: string, code: string): Promise<boolean>;
}
export function createOtp(c: Config): OtpProvider {
  if (c.OTP_PROVIDER === 'mock') {
    if (c.NODE_ENV === 'production') throw new Error('Mock OTP prohibited');
    return { request: async () => {}, confirm: async (_, code) => code === '246810' };
  }
  if (
    c.OTP_PROVIDER !== 'twilio' ||
    !/^AC[a-f0-9]{32}$/i.test(c.TWILIO_ACCOUNT_SID || '') ||
    !/^VA[a-f0-9]{32}$/i.test(c.TWILIO_VERIFY_SERVICE_SID || '') ||
    !c.TWILIO_AUTH_TOKEN
  )
    return {
      request: async () => {
        throw new Fault('unavailable', 503);
      },
      confirm: async () => {
        throw new Fault('unavailable', 503);
      },
    };
  const call = async (path: string, body: Record<string, string>) => {
    try {
      const r = await fetch(
        `https://verify.twilio.com/v2/Services/${c.TWILIO_VERIFY_SERVICE_SID}/${path}`,
        {
          method: 'POST',
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(c.TWILIO_ACCOUNT_SID + ':' + c.TWILIO_AUTH_TOKEN).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(body),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!r.ok) throw new Fault('verification_unavailable', 503);
      return (await r.json()) as { status: string };
    } catch {
      throw new Fault('verification_unavailable', 503);
    }
  };
  return {
    request: async (phone) => {
      await call('Verifications', { To: phone, Channel: 'sms' });
    },
    confirm: async (phone, code) =>
      (await call('VerificationCheck', { To: phone, Code: code })).status === 'approved',
  };
}
