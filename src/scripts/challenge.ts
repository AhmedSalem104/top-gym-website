import { challengeCopy, challengeError, type ChallengeLocale } from '../i18n/challenge';
import { playMotion } from './motion';
import { motion } from '../config/motion';
import { challengeApi, ApiError } from './challenge-api';
import { challengeAttribution, challengeEvent } from './challenge-attribution';
import { localizedChallengeTerms } from './challenge-terms';

type Localized = { ar: string; en: string };
interface State {
  status: string;
  maskedPhone: string;
  serverNow: number;
  score?: number;
  discount?: number;
  terms?: Localized;
  question?: {
    id: string;
    ordinal: number;
    total: number;
    startsAt: number;
    deadlineAt: number;
    text: Localized;
    options: { id: string; text: Localized }[];
  };
  coupon?: {
    code: string;
    discount: number;
    expiresAt: number;
    state: 'issued' | 'redeemed' | 'expired' | 'voided';
  } | null;
}
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
export function initChallenge() {
  const dialog = document.querySelector<HTMLDialogElement>('#challenge-dialog')!;
  const locale = dialog.dataset.locale as ChallengeLocale,
    c = challengeCopy[locale];
  const stage = dialog.querySelector<HTMLElement>('[data-challenge-stage]')!,
    status = dialog.querySelector<HTMLElement>('[data-challenge-status]')!;
  const title = dialog.querySelector<HTMLElement>('#challenge-title')!;
  let opener: HTMLElement | null = null,
    timer: ReturnType<typeof setInterval> | undefined,
    busy = false,
    state: State | undefined,
    lastQuestion = '',
    revision = 0,
    recoverQueued = false;
  let finishCount = () => {};
  const registrationKey = crypto.randomUUID();
  // Keep only a random retry secret. Phone/name are never placed in web storage.
  let enrollmentKey = crypto.randomUUID();
  try {
    const saved = sessionStorage.getItem('tg-challenge-entry');
    if (saved && /^[a-f0-9-]{36}$/i.test(saved))
      enrollmentKey = saved as `${string}-${string}-${string}-${string}-${string}`;
    sessionStorage.setItem('tg-challenge-entry', enrollmentKey);
  } catch {
    /* The HttpOnly session still supports normal refresh recovery. */
  }
  const terms = (text: Localized | undefined) => {
    if (text) {
      const d = el('details', undefined, 'challenge-terms');
      d.append(el('summary', c.terms), el('p', localizedChallengeTerms(text, locale)));
      stage.append(d);
    }
  };
  const attribution = challengeAttribution;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
    finishCount();
  };
  const message = (e: unknown) => {
    status.textContent = e instanceof ApiError ? challengeError(e.code, locale) : c.connection;
  };
  const button = (text: string, action: () => void, className = 'challenge-primary') => {
    const b = el('button', text, className);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  };
  const input = (
    form: HTMLElement,
    name: string,
    label: string,
    type = 'text',
    required = true,
  ) => {
    const wrap = el('label', label, 'challenge-field');
    const field = el('input');
    field.name = name;
    field.type = type;
    field.required = required;
    wrap.append(field);
    form.append(wrap);
    return field;
  };
  const reset = () => {
    stop();
    stage.replaceChildren();
    status.textContent = '';
    dialog.scrollTop = 0;
    dialog.dataset.step = 'entry';
    title.textContent = c.title;
  };
  const lock = (value: boolean) => {
    busy = value;
    stage
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) => (b.disabled = value || b.dataset.expired === 'true'));
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    lock(true);
    status.textContent = c.loading;
    try {
      await fn();
      status.textContent = '';
    } catch (e) {
      message(e);
    } finally {
      lock(false);
      if (recoverQueued && dialog.open) {
        recoverQueued = false;
        void recover();
      }
    }
  };
  async function recover() {
    if (busy) {
      recoverQueued = true;
      return;
    }
    await run(async () => {
      state = await challengeApi<State>('challenge/sync', {});
      render(state);
    });
  }
  function phoneStep() {
    reset();
    stage.append(el('p', c.intro, 'challenge-intro'), el('p', c.rules, 'challenge-rules'));
    const form = el('form');
    const p = input(form, 'phone', c.phone, 'tel');
    p.autocomplete = 'tel';
    p.inputMode = 'tel';
    p.maxLength = 40;
    p.placeholder = '01xxxxxxxxx';
    form.append(el('p', c.phoneHint, 'challenge-hint'));
    const submit = el('button', c.continue, 'challenge-primary');
    submit.type = 'submit';
    form.append(submit);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void run(async () => {
        state = await challengeApi<State>(
          'challenge/enroll',
          { phone: p.value },
          { 'Idempotency-Key': enrollmentKey },
        );
        render(state);
      });
    });
    stage.append(form);
  }
  function render(s: State) {
    if (!dialog.open) return;
    const previous = lastQuestion;
    state = s;
    reset();
    if (s.status === 'eligible') {
      stage.append(
        el('p', c.entered + ' · ' + s.maskedPhone, 'challenge-kicker'),
        el('p', c.intro, 'challenge-intro'),
        el('p', c.rules, 'challenge-rules'),
        button(
          c.start,
          () =>
            void run(async () => {
              render(
                await challengeApi<State>('challenge/start', {
                  locale,
                  attribution: attribution(),
                }),
              );
            }),
        ),
      );
      return;
    }
    if (s.question) {
      dialog.dataset.step = 'question';
      const q = s.question;
      lastQuestion = q.id;
      const header = el('div', undefined, 'challenge-progress');
      header.append(el('span', `${c.question} ${q.ordinal} ${c.of} 3`));
      const time = el('span', undefined, 'challenge-time');
      time.setAttribute('role', 'timer');
      time.setAttribute('aria-live', 'off');
      header.append(time);
      const track = el('div', undefined, 'challenge-timer-track'),
        bar = el('div', undefined, 'challenge-timer-fill');
      track.append(bar);
      const heading = el('h3', q.text[locale], 'challenge-question');
      heading.tabIndex = -1;
      const options = el('div', undefined, 'challenge-options');
      const remainingAtArrival = Math.max(0, q.deadlineAt - s.serverNow);
      const duration = q.deadlineAt - q.startsAt;
      const received = performance.now();
      let expiring = false;
      const key = crypto.randomUUID();
      for (const [index, option] of q.options.entries()) {
        const b = button(
          '',
          () => {
            if (busy || performance.now() - received >= remainingAtArrival) return;
            b.setAttribute('aria-pressed', 'true');
            void run(async () => {
              render(
                await challengeApi<State>(
                  'challenge/answer',
                  { question: q.id, option: option.id },
                  { 'Idempotency-Key': key },
                ),
              );
            }).then(() => {
              if (state?.question?.id === q.id && !stage.querySelector('[data-recover]')) {
                const b = button(c.retry, () => void recover(), 'challenge-secondary');
                b.dataset.recover = 'true';
                stage.append(b);
              }
            });
          },
          'challenge-option',
        );
        b.append(
          el('span', String(index + 1), 'challenge-option-index'),
          el('span', option.text[locale]),
        );
        options.append(b);
      }
      stage.append(header, track, heading, options);
      const tick = () => {
        const remaining = Math.max(0, remainingAtArrival - (performance.now() - received));
        time.textContent = `${Math.ceil(remaining / 1000)} ${c.seconds}`;
        bar.style.transform = `scaleX(${duration > 0 ? Math.min(1, remaining / duration) : 0})`;
        if (remaining <= 0 && !expiring) {
          expiring = true;
          stop();
          options.querySelectorAll('button').forEach((b) => {
            b.disabled = true;
            b.dataset.expired = 'true';
          });
          void recover();
        }
      };
      tick();
      if (!expiring) timer = setInterval(tick, 50);
      if (previous !== q.id) {
        heading.focus({ preventScroll: true });
        void playMotion(heading, 'feedback');
      }
      return;
    }
    dialog.dataset.step = 'result';
    const score = s.score || 0;
    const result = el('div', undefined, 'challenge-result');
    const value = el('strong', `${s.discount || 0}%`, 'challenge-result-value');
    const scoreLine = el('p');
    const scoreValue = el('span', String(score), 'challenge-score-value');
    scoreLine.append(scoreValue, document.createTextNode(` / 3 · ${c.correct}`));
    result.append(
      el('span', c.result, 'challenge-kicker'),
      value,
      el('h3', c.resultTitles[score]),
      scoreLine,
    );
    stage.append(result);
    if (s.status !== 'registered') {
      const form = el('form', undefined, 'challenge-registration');
      form.append(el('h4', c.finish), el('p', c.finishHint, 'challenge-hint'));
      const name = input(form, 'name', c.name);
      name.autocomplete = 'name';
      name.minLength = 2;
      name.maxLength = 100;
      form.append(el('p', s.maskedPhone, 'challenge-kicker'));
      const check = (label: string, required: boolean) => {
        const l = el('label', undefined, 'challenge-check');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.required = required;
        l.append(cb, el('span', label));
        form.append(l);
        return cb;
      };
      const consent = check(c.consent, true);
      form.append(el('p', c.privacy, 'challenge-hint'));
      const submit = el('button', c.save, 'challenge-primary');
      submit.type = 'submit';
      form.append(submit);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        void run(async () => {
          render(
            await challengeApi<State>(
              'challenge/finalize',
              {
                name: name.value.trim(),
                consent: consent.checked,
              },
              { 'Idempotency-Key': registrationKey },
            ),
          );
        });
      });
      stage.append(form);
      terms(s.terms);
    } else {
      stage.append(el('h3', c.saved), el('p', c.mail));
      if (s.coupon) {
        const card = el('div', undefined, 'challenge-coupon');
        const code = el('code', s.coupon.code);
        code.dir = 'ltr';
        card.append(
          el('span', c.coupon),
          code,
          el('p', c.statuses[s.coupon.state]),
          el(
            'p',
            c.expires +
              ' ' +
              new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
                dateStyle: 'medium',
                timeZone: 'Africa/Cairo',
              }).format(s.coupon.expiresAt),
          ),
        );
        stage.append(card);
      } else stage.append(el('p', c.noCoupon));
      terms(s.terms);
      const link = el('a', c.memberships, 'challenge-secondary');
      link.href = '#memberships';
      link.addEventListener('click', () => dialog.close());
      stage.append(link);
    }
    title.focus({ preventScroll: true });
    if (previous) {
      lastQuestion = '';
      void playMotion(result, 'enter');
      if (score > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Decorative count-up is bounded by the shared entrance timing; it never
        // changes the authoritative result or blocks registration controls.
        const started = performance.now();
        let frame = 0;
        const finalDiscount = s.discount || 0;
        value.textContent = '0%';
        scoreValue.textContent = '0';
        finishCount = () => {
          cancelAnimationFrame(frame);
          value.textContent = `${finalDiscount}%`;
          scoreValue.textContent = String(score);
          finishCount = () => {};
        };
        const count = (now: number) => {
          const progress = Math.min(1, (now - started) / motion.duration.enter);
          value.textContent = `${Math.round(finalDiscount * progress)}%`;
          scoreValue.textContent = String(Math.round(score * progress));
          if (progress < 1 && dialog.open && !document.hidden) frame = requestAnimationFrame(count);
          else finishCount();
        };
        frame = requestAnimationFrame(count);
        const confetti = el('div', undefined, 'challenge-confetti');
        confetti.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < (score === 3 ? 18 : 10); i++) {
          const bit = el('i');
          bit.style.setProperty('--x', `${(i % 6) * 18}%`);
          bit.style.setProperty('--delay', `${i * 35}ms`);
          confetti.append(bit);
        }
        result.append(confetti);
        setTimeout(() => confetti.remove(), 1800);
      }
    }
  }
  const close = () => {
    revision++;
    stop();
    dialog.close();
    opener?.focus({ preventScroll: true });
  };
  dialog.querySelector('[data-challenge-close]')!.addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('close', stop);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && dialog.open && state?.status === 'active') void recover();
  });
  window.addEventListener('pagehide', stop);
  function unavailable() {
    reset();
    dialog.dataset.step = 'unavailable';
    title.textContent = c.unavailableTitle;
    const card = el('div', undefined, 'challenge-availability');
    card.append(el('p', c.unavailable));
    const actions = el('div', undefined, 'challenge-availability-actions');
    const memberships = el('a', c.memberships, 'challenge-primary');
    memberships.href = '#memberships';
    memberships.addEventListener('click', () => {
      close();
      const target = document.querySelector<HTMLElement>('#memberships');
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    });
    const contact = el('a', c.callGym, 'challenge-secondary');
    contact.href = dialog.dataset.contact!;
    actions.append(memberships, contact);
    card.append(actions);
    stage.append(
      card,
      button(c.availabilityRetry, () => void open(), 'challenge-secondary'),
    );
  }
  async function open() {
    if (!dialog.open) opener = document.activeElement as HTMLElement;
    const version = ++revision;
    if (!dialog.open) dialog.showModal();
    title.focus();
    reset();
    stage.append(el('p', c.loading));
    void playMotion(dialog.querySelector<HTMLElement>('.challenge-shell')!, 'enter');
    try {
      const info = await challengeApi<{
        available: boolean;
        terms: Localized | null;
        mode: string;
      }>('challenge/info');
      if (version !== revision) return;
      dialog.querySelector<HTMLElement>('[data-challenge-local]')!.hidden = info.mode !== 'local';
      if (!info.available) {
        try {
          const saved = await challengeApi<State>('challenge/sync', {});
          if (version !== revision) return;
          if (saved.status !== 'eligible') {
            render(saved);
            return;
          }
        } catch {
          /* Availability message does not disclose another identity. */
        }
        if (version !== revision) return;
        unavailable();
        return;
      }
      void challengeApi('challenge/event', challengeEvent('challenge_opened')).catch(() => {});
      try {
        const restored = await challengeApi<State>('challenge/sync', {});
        if (version !== revision) return;
        render(restored);
      } catch (e) {
        if (version !== revision) return;
        if (e instanceof ApiError && e.status === 401) {
          phoneStep();
          terms(info.terms || undefined);
        } else throw e;
      }
    } catch (e) {
      if (version !== revision) return;
      reset();
      message(e);
      stage.append(button(c.availabilityRetry, () => void open(), 'challenge-secondary'));
    }
  }
  return { open };
}
