import { feedbackCopy } from '../i18n/feedback';
import { feedbackLimits } from '../config/feedback';
import { playMotion } from './motion';

const form = document.querySelector<HTMLFormElement>('[data-feedback-form]');
if (form) {
  const locale = form.dataset.locale === 'ar' ? 'ar' : 'en';
  const copy = feedbackCopy[locale];
  const submit = form.querySelector<HTMLButtonElement>('[data-feedback-submit]')!;
  const status = form.querySelector<HTMLElement>('[data-feedback-status]')!;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'),
  );
  let pending: { key: string; body: string } | undefined;
  let sending = false;
  const say = (text: string, state = 'error') => {
    status.textContent = text;
    status.dataset.state = state;
  };
  const lock = (value: boolean) =>
    controls.forEach((control) => {
      control.disabled = value;
    });
  const setButton = (label: string, disabled: boolean) => {
    submit.querySelector('span')!.textContent = label;
    submit.disabled = disabled;
  };
  const clearErrors = () => {
    form.querySelectorAll('[data-error]').forEach((el) => {
      el.textContent = '';
    });
    controls.forEach((el) => el.removeAttribute('aria-invalid'));
  };
  const showErrors = (fields: string[]) => {
    for (const field of fields) {
      const target = form.querySelector<HTMLElement>('[data-error="' + field + '"]');
      if (target)
        target.textContent = copy.errors[field as keyof typeof copy.errors] || copy.errors.invalid;
      form
        .querySelectorAll('[name="' + field + '"]')
        .forEach((el) => el.setAttribute('aria-invalid', 'true'));
    }
    const first = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    const details = first?.closest('details');
    if (details) details.open = true;
    first?.focus();
  };
  form.addEventListener('change', () => {
    const selected = Number(
      (form.querySelector('input[name="rating"]:checked') as HTMLInputElement | null)?.value,
    );
    form.querySelectorAll<HTMLElement>('.feedback-star').forEach((star, index) => {
      star.toggleAttribute('data-selected', index < selected);
    });
    form.querySelector('[data-rating-description]')!.textContent = selected
      ? copy.ratings[selected - 1]
      : copy.ratingHint;
  });
  message.addEventListener('input', () => {
    form.querySelector('[data-character-count]')!.textContent =
      message.value.length.toLocaleString(locale) +
      ' / ' +
      feedbackLimits.messageMax.toLocaleString(locale);
  });
  // Configuration status contains no email addresses, provider details or secrets.
  void fetch('/api/feedback/', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
    .then((response) => response.json())
    .then((result: { available?: boolean }) => {
      if (result.available) {
        setButton(copy.send, false);
        return;
      }
      say(copy.errors.unavailable);
    })
    .catch(() => say(copy.errors.unavailable));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    clearErrors();
    if (!pending) {
      const data = new FormData(form);
      const value = {
        rating: Number(data.get('rating')),
        categories: data.getAll('categories'),
        message: String(data.get('message') || '').trim(),
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        replyRequested: data.get('replyRequested') === 'on',
        website: String(data.get('website') || ''),
        locale,
      };
      const errors = [];
      if (value.rating < 1 || value.rating > 5) errors.push('rating');
      if (!value.categories.length) errors.push('categories');
      if (
        value.message.length < feedbackLimits.messageMin ||
        value.message.length > feedbackLimits.messageMax
      )
        errors.push('message');
      if (value.name.length > feedbackLimits.nameMax) errors.push('name');
      if (!(form.elements.namedItem('email') as HTMLInputElement).validity.valid)
        errors.push('email');
      if (value.replyRequested && !value.email) errors.push('replyRequested');
      if (errors.length) {
        say(copy.errors.invalid);
        showErrors(errors);
        return;
      }
      pending = { key: crypto.randomUUID(), body: JSON.stringify(value) };
    }
    sending = true;
    lock(true);
    setButton(copy.sending, true);
    form.setAttribute('aria-busy', 'true');
    say(copy.sending, 'loading');
    try {
      const response = await fetch('/api/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key },
        body: pending.body,
        signal: AbortSignal.timeout(35_000),
      });
      const result = (await response.json()) as {
        status?: string;
        code?: keyof typeof copy.errors;
        fields?: string[];
      };
      if (response.ok && result.status === 'accepted') {
        say(copy.success + ' ' + copy.successNote, 'success');
        setButton(copy.send, true);
        status.focus({ preventScroll: true });
        void playMotion(status, 'feedback');
      } else {
        const code = result.code || 'unavailable';
        say(copy.errors[code] || copy.errors.unavailable);
        if (code === 'uncertain' || code === 'conflict') setButton(copy.send, true);
        else {
          setButton(copy.retry, false);
          // Only a definitive rejection/validation failure permits a fresh delivery key.
          // A transient store outage or rate limit can happen after an earlier acceptance.
          if (['rejected', 'invalid', 'blocked'].includes(code)) {
            pending = undefined;
            lock(false);
          }
          if (result.fields) showErrors(result.fields);
        }
      }
    } catch {
      // Keep the same key and payload: retry checks the existing delivery instead of duplicating it.
      say(copy.errors.network);
      setButton(copy.retry, false);
    } finally {
      sending = false;
      form.removeAttribute('aria-busy');
    }
  });
}
