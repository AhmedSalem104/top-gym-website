import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { z } from 'zod';

export class Fault extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
export const opaque = () => randomBytes(32).toString('base64url');
export const digest = (key: string, text: string) =>
  createHmac('sha256', Buffer.from(key, 'hex')).update(text).digest('hex');
export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function seal(key: string, text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
export function unseal(key: string, text: string) {
  const b = Buffer.from(text, 'base64url');
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), b.subarray(0, 12));
  cipher.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([cipher.update(b.subarray(28)), cipher.final()]).toString('utf8');
}
export function phone(input: string) {
  let p = input
    .normalize('NFKC')
    .replace(/[٠-٩۰-۹]/g, (c) => String(c.charCodeAt(0) - (c <= '٩' ? 1632 : 1776)))
    .replace(/[\s()-]/g, '');
  if (p.startsWith('0020')) p = '+' + p.slice(2);
  if (/^01[0125]\d{8}$/.test(p)) p = '+20' + p.slice(1);
  if (/^201[0125]\d{8}$/.test(p)) p = '+' + p;
  if (!/^\+201[0125]\d{8}$/.test(p)) throw new Fault('invalid_phone', 422);
  return p;
}
export const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (s) =>
        ![...s].some((c) => {
          const n = c.codePointAt(0)!;
          return (
            n < 32 || n === 127 || (n >= 0x202a && n <= 0x202e) || (n >= 0x2066 && n <= 0x2069)
          );
        }),
    );
export const email = z.union([z.email().max(254), z.literal('')]).optional();
export function totp(secret: string, time: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secret.toUpperCase()) {
    const n = alphabet.indexOf(char);
    if (n < 0) throw new Error('Invalid TOTP secret');
    bits += n.toString(2).padStart(5, '0');
  }
  const key = Buffer.from((bits.match(/.{8}/g) || []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const hash = createHmac('sha1', key).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
export function matchTotp(secret: string, code: string, now: number) {
  if (!/^\d{6}$/.test(code)) return -1;
  for (const delta of [0, -1, 1])
    if (equal(totp(secret, now + delta * 30000), code)) return Math.floor(now / 30000) + delta;
  return -1;
}
