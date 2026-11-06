import {
  motion,
  motionDuration,
  motionFrames,
  staggerDelay,
  type MotionTransition,
  type MotionVariant,
} from '../config/motion';

const seen = new WeakSet<HTMLElement>();
const active = new Map<HTMLElement, Animation>();
let preference: MediaQueryList | undefined;
let dispose: (() => void) | undefined;

export function cancelMotion(element: HTMLElement) {
  active.get(element)?.cancel();
  active.delete(element);
}

/** Native, interruptible transitions. No inline end styles or retained animation layers. */
export async function playMotion(element: HTMLElement, variant: MotionTransition, delay = 0) {
  const frames = motionFrames(variant);
  // Reversing an in-flight disclosure starts at its painted frame, not a fixed endpoint.
  if (active.has(element)) {
    const current = getComputedStyle(element);
    frames[0] = { opacity: current.opacity, transform: current.transform };
  }
  cancelMotion(element);
  if (preference?.matches || !element.animate) return;
  let animation: Animation | undefined;
  try {
    animation = element.animate(frames, {
      duration: motionDuration(variant),
      delay,
      easing: variant === 'exit' ? motion.exitEasing : motion.easing,
      fill: 'backwards',
    });
    active.set(element, animation);
    await animation.finished;
  } catch {
    // Cancellation, missing APIs or a failing animation always leave the SSR content readable.
  } finally {
    if (animation && active.get(element) === animation) {
      animation.cancel();
      active.delete(element);
    }
  }
}

/** Idempotent: one reveal observer and one child-list observer for the entire page. */
export function initMotion() {
  dispose?.();
  preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const signal = new AbortController();
  let observer: IntersectionObserver | undefined;
  const hero = document.querySelector<HTMLElement>('[data-header-boundary]');
  const heroToggle = hero?.querySelector<HTMLButtonElement>('[data-hero-motion-toggle]');
  let heroVisible = false;
  let heroPaused = heroToggle?.getAttribute('aria-pressed') === 'true';
  const updateHero = () => {
    if (hero)
      hero.dataset.cinematic =
        observer && heroVisible && !document.hidden && !preference?.matches && !heroPaused
          ? 'running'
          : 'paused';
    if (heroToggle) heroToggle.disabled = !observer || Boolean(preference?.matches);
  };
  const pending = new Set<HTMLElement>();
  const complete = (element: HTMLElement) => {
    seen.add(element);
    pending.delete(element);
    observer?.unobserve(element);
    cancelMotion(element);
    element.dataset.motionState = 'complete';
  };

  try {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries)
        if (entry.target.hasAttribute('data-header-boundary')) {
          heroVisible = entry.isIntersecting;
          updateHero();
          document
            .querySelector('.site-header')
            ?.classList.toggle(
              'is-scrolled',
              !entry.isIntersecting && entry.boundingClientRect.bottom <= 0,
            );
        }
      const visible = entries.filter(
        (entry) =>
          entry.target.hasAttribute('data-motion') &&
          entry.isIntersecting &&
          entry.intersectionRatio >= motion.observer.threshold,
      );
      visible.sort((a, b) =>
        a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const groups = new Map<Element | null, number>();
      for (const entry of visible) {
        const element = entry.target as HTMLElement;
        if (seen.has(element)) continue;
        seen.add(element);
        pending.delete(element);
        observer?.unobserve(element);
        if (
          preference?.matches ||
          entry.boundingClientRect.bottom <= 0 ||
          // Late initialization, fast scrolling and anchor jumps must not hide painted content.
          entry.boundingClientRect.top < window.innerHeight ||
          element.contains(document.activeElement)
        ) {
          complete(element);
          continue;
        }
        const group = element.closest('[data-motion-group]');
        const index = groups.get(group) ?? 0;
        groups.set(group, index + 1);
        const step =
          Number(element.dataset.motionStep ?? (group as HTMLElement | null)?.dataset.motionStep) ||
          0;
        element.dataset.motionState = 'running';
        void playMotion(
          element,
          element.dataset.motion as MotionVariant,
          staggerDelay(index, step),
        ).then(() => {
          element.dataset.motionState = 'complete';
        });
      }
    }, motion.observer);
  } catch {
    // Unsupported/blocked observers never hide content.
  }

  const register = (root: ParentNode) => {
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-motion]'));
    if (root instanceof HTMLElement && root.matches('[data-motion]')) elements.unshift(root);
    for (const element of elements) {
      if (seen.has(element) || pending.has(element)) continue;
      // Initial hero motion is CSS-owned from first paint, using the same tokens.
      if (!observer || preference?.matches || element.closest('.hero, .header-inner'))
        complete(element);
      else {
        element.dataset.motionState = 'pending'; // Diagnostic only; no hidden CSS state.
        pending.add(element);
        observer.observe(element);
      }
    }
  };
  register(document);
  // Observe the whole hero: a 1px sentinel can skip the viewport on fast anchor jumps.
  const headerBoundary = document.querySelector('[data-header-boundary]');
  if (headerBoundary) observer?.observe(headerBoundary);
  heroToggle?.addEventListener(
    'click',
    () => {
      heroPaused = !heroPaused;
      heroToggle.setAttribute('aria-pressed', String(heroPaused));
      updateHero();
    },
    { signal: signal.signal },
  );
  document.addEventListener('visibilitychange', updateHero, { signal: signal.signal });
  updateHero();
  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) if (node instanceof HTMLElement) register(node);
      for (const node of record.removedNodes)
        if (node instanceof HTMLElement) {
          for (const element of pending)
            if (node === element || node.contains(element)) {
              observer?.unobserve(element);
              pending.delete(element);
            }
          for (const element of active.keys())
            if (node === element || node.contains(element)) cancelMotion(element);
        }
    }
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('motion:refresh', () => register(document), { signal: signal.signal });
  document.addEventListener(
    'focusin',
    (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      for (const element of pending) if (element.contains(event.target)) complete(element);
      for (const element of active.keys())
        if (element.hasAttribute('data-motion') && element.contains(event.target))
          cancelMotion(element);
    },
    { signal: signal.signal },
  );
  preference.addEventListener(
    'change',
    () => {
      updateHero();
      if (!preference?.matches) return;
      for (const element of pending) complete(element);
      for (const element of active.keys()) cancelMotion(element);
    },
    { signal: signal.signal },
  );

  dispose = () => {
    if (hero) hero.dataset.cinematic = 'paused';
    signal.abort();
    observer?.disconnect();
    mutations.disconnect();
    pending.clear();
    for (const element of active.keys()) cancelMotion(element);
  };
}

window.addEventListener('pagehide', () => dispose?.());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initMotion();
});
