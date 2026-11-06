import { business, durationIds, type Duration, type Locale } from '../config/business';
import { durations, money, t } from '../i18n';
import { getCairoStatus } from '../utils/hours';
import { initMotion, playMotion } from './motion';
import { initNavigation } from './navigation';

initMotion();
initNavigation();

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
document.querySelectorAll<HTMLAnchorElement>('[data-language-switch]').forEach((link) =>
  link.addEventListener('click', (event) => {
    const target = event.currentTarget as HTMLAnchorElement;
    target.hash = location.hash;
    try {
      localStorage.setItem(preferenceKey, locale === 'ar' ? 'en' : 'ar');
    } catch {
      /* Navigation still works. */
    }
  }),
);

const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.querySelector<HTMLElement>('#mobile-nav');
let menuRevision = 0;
async function closeMenu(restoreFocus = false) {
  if (!menu || !toggle) return;
  if (toggle.getAttribute('aria-expanded') === 'false') return;
  const revision = ++menuRevision;
  toggle.setAttribute('aria-expanded', 'false');
  menu.inert = true;
  if (restoreFocus) toggle.focus();
  await playMotion(menu, 'exit');
  if (revision === menuRevision) menu.hidden = true;
}
toggle?.addEventListener('click', () => {
  if (!menu) return;
  if (toggle.getAttribute('aria-expanded') === 'true') {
    void closeMenu(true);
    return;
  }
  menuRevision++;
  menu.hidden = false;
  menu.inert = false;
  toggle.setAttribute('aria-expanded', 'true');
  menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
  void playMotion(menu, 'enter');
});
menu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    void closeMenu();
    const href = a.getAttribute('href');
    if (href?.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      target?.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    }
  }),
);
document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLElement && !event.target.closest('.site-header'))
    void closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLElement && !event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 1360px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

const durationTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-duration]'));
function selectDuration(tab: HTMLButtonElement) {
  const value = tab.dataset.duration as Duration;
  if (!durationIds.includes(value)) return;
  durationTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.querySelector('#membership-prices')?.setAttribute('aria-labelledby', tab.id);
  business.memberships.forEach((plan) => {
    const price = document.querySelector(`[data-price="${plan.id}"]`);
    if (price instanceof HTMLElement) {
      price.textContent = money(plan.prices[value], locale);
      void playMotion(price, 'feedback');
    }
  });
  document.querySelectorAll('[data-duration-label]').forEach((node) => {
    node.textContent = durations[value][locale];
  });
}
durationTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectDuration(tab));
  tab.addEventListener('keydown', (event) => {
    let next: number;
    const forward = locale === 'ar' ? 'ArrowLeft' : 'ArrowRight';
    const backward = locale === 'ar' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) next = (index + 1) % durationTabs.length;
    else if (event.key === backward) next = (index - 1 + durationTabs.length) % durationTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = durationTabs.length - 1;
    else return;
    event.preventDefault();
    selectDuration(durationTabs[next]);
    durationTabs[next].focus();
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
const documentStage = document.querySelector<HTMLElement>('#lightbox-stage');
const zoomButton = document.querySelector<HTMLButtonElement>('[data-lightbox-zoom]');
let certificateZoomed = false;
function setCertificateZoom(zoomed: boolean) {
  if (!dialog || !photo || !documentStage || !zoomButton) return;
  certificateZoomed = zoomed && dialog.dataset.gallery === 'certificates';
  dialog.dataset.zoomed = String(certificateZoomed);
  zoomButton.setAttribute('aria-pressed', String(certificateZoomed));
  const label = zoomButton.querySelector('span');
  if (label)
    label.textContent = certificateZoomed ? copy.certificateZoomOut : copy.certificateZoomIn;
  if (certificateZoomed) {
    photo.style.setProperty('--document-width', `${photo.naturalWidth}px`);
    documentStage.tabIndex = 0;
    documentStage.setAttribute('role', 'region');
    documentStage.setAttribute('aria-label', copy.certificatePan);
  } else {
    photo.style.removeProperty('--document-width');
    documentStage.removeAttribute('tabindex');
    documentStage.removeAttribute('role');
    documentStage.removeAttribute('aria-label');
    documentStage.scrollTop = 0;
    documentStage.scrollLeft = 0;
  }
}
zoomButton?.addEventListener('click', () => setCertificateZoom(!certificateZoomed));
let activeImages: HTMLAnchorElement[] = [];
let currentIndex = 0;
let opener: HTMLAnchorElement | null = null;
function showImage(index: number) {
  if (!photo || !caption || !count || !activeImages.length) return;
  currentIndex = (index + activeImages.length) % activeImages.length;
  const item = activeImages[currentIndex];
  if (dialog) dialog.dataset.gallery = item.dataset.lightbox;
  setCertificateZoom(false);
  if (zoomButton) {
    zoomButton.hidden = item.dataset.lightbox !== 'certificates';
    zoomButton.disabled = true;
  }
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
    void playMotion(dialog, 'enter');
  });
});
let closingDialog = false;
async function closeLightbox() {
  if (!dialog?.open || closingDialog) return;
  closingDialog = true;
  dialog.classList.add('is-closing');
  await playMotion(dialog, 'exit');
  dialog.close();
  dialog.classList.remove('is-closing');
  closingDialog = false;
}
dialog
  ?.querySelector('[data-lightbox-close]')
  ?.addEventListener('click', () => void closeLightbox());
dialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  void closeLightbox();
});
photo?.addEventListener('load', () => {
  if (zoomButton) zoomButton.disabled = false;
  if (dialog?.open) void playMotion(photo, 'feedback');
});
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
    void closeLightbox();
});
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ).filter((control) => control.getClientRects().length > 0);
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
    // Arrow keys pan the native scroll region while inspecting a zoomed document.
    if (certificateZoomed && document.activeElement === documentStage) return;
    event.preventDefault();
    const advance = locale === 'ar' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    showImage(currentIndex + (advance ? 1 : -1));
  }
});
dialog?.addEventListener('close', () => {
  setCertificateZoom(false);
  document.body.classList.remove('dialog-open');
  opener?.focus({ preventScroll: true });
});
