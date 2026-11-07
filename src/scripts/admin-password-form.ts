import { challengeCopy, challengeError, type ChallengeLocale } from '../i18n/challenge';
import { ApiError, challengeApi } from './challenge-api';

export interface AdminSession {
  csrf: string;
  role: string;
}

/** Shared by the discreet logo dialog and the dashboard's signed-out screen. */
export function adminPasswordForm(
  locale: ChallengeLocale,
  onSuccess: (session: AdminSession) => void | Promise<void>,
) {
  const c = challengeCopy[locale];
  const form = document.createElement('form');
  form.className = 'admin-password-form';
  const label = document.createElement('label');
  label.className = 'challenge-field';
  label.textContent = c.password;
  const input = document.createElement('input');
  input.id = 'admin-password-' + crypto.randomUUID();
  input.name = 'admin-password';
  input.type = 'password';
  input.required = true;
  input.maxLength = 128;
  input.autocomplete = 'current-password';
  input.autocapitalize = 'off';
  input.spellcheck = false;
  input.dir = 'ltr';
  label.htmlFor = input.id;
  const field = document.createElement('div');
  field.className = 'admin-password-control';
  const show = document.createElement('button');
  show.type = 'button';
  show.className = 'admin-password-toggle';
  show.textContent = c.accessShow;
  show.setAttribute('aria-controls', input.id);
  show.setAttribute('aria-pressed', 'false');
  show.addEventListener('click', () => {
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    show.textContent = reveal ? c.accessHide : c.accessShow;
    show.setAttribute('aria-pressed', String(reveal));
  });
  field.append(input, show);
  const status = document.createElement('p');
  status.className = 'admin-access-status';
  status.id = input.id + '-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  input.setAttribute('aria-describedby', status.id);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'challenge-primary';
  submit.textContent = c.accessSubmit;
  form.append(label, field, submit, status);
  let busy = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    input.removeAttribute('aria-invalid');
    status.textContent = c.loading;
    void (async () => {
      try {
        const session = await challengeApi<AdminSession>('admin/access', { password: input.value });
        input.value = '';
        if (form.isConnected) await onSuccess(session);
      } catch (error) {
        if (!form.isConnected) return;
        status.textContent =
          error instanceof ApiError
            ? error.code === 'invalid_login'
              ? c.accessInvalid
              : challengeError(error.code, locale)
            : c.connection;
        if (error instanceof ApiError && error.code === 'invalid_login')
          input.setAttribute('aria-invalid', 'true');
        input.focus({ preventScroll: true });
      } finally {
        input.value = '';
        busy = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    })();
  });
  return { form, input };
}
