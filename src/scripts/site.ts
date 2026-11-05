import { business, durationIds, type Duration, type Locale } from '../config/business';
import { durations, money, t } from '../i18n';
import { getCairoStatus } from '../utils/hours';

const locale: Locale = document.documentElement.lang === 'en' ? 'en' : 'ar';
const copy = t(locale);
const preferenceKey = 'top-gym-language';
try {
  const saved = localStorage.getItem(preferenceKey);
  if (document.documentElement.dataset.root === 'true' && (saved === 'ar' || saved === 'en')) {
    location.replace(`/${saved}/${location.hash}`);
  }
} catch {
  /* Storage can be unavailable; the localized links remain functional. */
}
document
  .querySelector<HTMLAnchorElement>('[data-language-switch]')
  ?.addEventListener('click', (event) => {
    const target = event.currentTarget as HTMLAnchorElement;
    target.hash = location.hash;
    try {
      localStorage.setItem(preferenceKey, locale === 'ar' ? 'en' : 'ar');
    } catch {
      /* Navigation still works. */
    }
  });

const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.querySelector<HTMLElement>('#mobile-nav');
function closeMenu(restoreFocus = false) {
  if (!menu || !toggle) return;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle.focus();
}
toggle?.addEventListener('click', () => {
  if (!menu) return;
  menu.hidden = !menu.hidden;
  toggle.setAttribute('aria-expanded', String(!menu.hidden));
});
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLElement && !event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 1200px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

document
  .querySelector<HTMLSelectElement>('#membership-duration')
  ?.addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value as Duration;
    if (!durationIds.includes(value)) return;
    business.memberships.forEach((plan) => {
      const price = document.querySelector(`[data-price="${plan.id}"]`);
      if (price) price.textContent = money(plan.prices[value], locale);
    });
    document.querySelectorAll('[data-duration-label]').forEach((node) => {
      node.textContent = durations[value][locale];
    });
  });

function updateHours() {
  const state = getCairoStatus();
  document.querySelectorAll<HTMLElement>('[data-day]').forEach((row) => {
    const today = Number(row.dataset.day) === state.day;
    row.classList.toggle('is-today', today);
    const label = row.querySelector<HTMLElement>('.today-label');
    if (label) label.hidden = !today;
  });
  const status = document.querySelector<HTMLElement>('[data-open-status]');
  if (status) {
    status.hidden = false;
    status.textContent = state.isOpen ? copy.open : copy.closed;
  }
}
updateHours();
setInterval(updateHours, 30_000);
document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Intl.DateTimeFormat('en', {
    timeZone: business.timezone,
    year: 'numeric',
  }).format(new Date());
});

const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
const photo = document.querySelector<HTMLImageElement>('#lightbox-image');
const caption = document.querySelector<HTMLElement>('#lightbox-caption');
const count = document.querySelector<HTMLElement>('#lightbox-count');
let activeImages: HTMLAnchorElement[] = [];
let currentIndex = 0;
let opener: HTMLAnchorElement | null = null;
function showImage(index: number) {
  if (!photo || !caption || !count || !activeImages.length) return;
  currentIndex = (index + activeImages.length) % activeImages.length;
  const item = activeImages[currentIndex];
  photo.src = item.href;
  photo.alt = item.dataset.alt ?? '';
  caption.textContent = item.dataset.caption ?? '';
  const number = new Intl.NumberFormat(locale);
  count.textContent = `${number.format(currentIndex + 1)} ${copy.imageOf} ${number.format(activeImages.length)}`;
}
document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    if (!dialog?.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    activeImages = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]'),
    ).filter((item) => item.dataset.lightbox === anchor.dataset.lightbox);
    opener = anchor;
    showImage(activeImages.indexOf(anchor));
    document.body.classList.add('dialog-open');
    dialog.showModal();
  });
});
dialog?.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
dialog
  ?.querySelector('[data-lightbox-prev]')
  ?.addEventListener('click', () => showImage(currentIndex - 1));
dialog
  ?.querySelector('[data-lightbox-next]')
  ?.addEventListener('click', () => showImage(currentIndex + 1));
dialog?.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    const controls = Array.from(
      dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    const advance = locale === 'ar' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    showImage(currentIndex + (advance ? 1 : -1));
  }
});
dialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  opener?.focus({ preventScroll: true });
});
