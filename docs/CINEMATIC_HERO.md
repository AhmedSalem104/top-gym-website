# Cinematic Hero — 6 November 2026

## Scope and visual responsibility

The owner requested continuous cinematic movement of the approved full-width image, then refined the direction to a 24–32 second camera cycle and separate warm lighting. The supplied image, embedded wall emblem, responsive sources, content, layout, CTA targets and original website logo remain unchanged. No unrelated component or business data is edited. The customer-feedback work remains isolated on `feat/customer-feedback`; this branch neither implements nor configures email delivery. There is no membership/payment portal in this repository to alter.

The design stays black-and-gold with the existing typography and directional text scrim. Only background layers move continuously. Pointer parallax is deliberately omitted: the brief makes it optional and prioritizes stable camera movement/performance. No pointer tracking, extra observer, WebGL, canvas, animation dependency, video asset or render loop ships to the browser.

| Layer                        | Owner                            | Motion                                                                  |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `.hero-camera`               | CSS `hero-drift`                 | One 30-second closed cycle with three gentle camera poses               |
| `.hero-visual::after`        | CSS `hero-light`                 | 22-second warm gradient movement, 3.5% opacity / 2% mobile              |
| `.hero-image` / actual image | Static responsive media          | Immediate opaque high-priority image; previous picture entrance removed |
| Text and CTAs                | Existing first-paint system      | One 560ms / 80ms sequence, no continuous transform                      |
| Motion control               | Native button / shared lifecycle | Pause at the current frame, resume without restarting                   |

The existing text overlay stays above the lighting, preserving contrast in Arabic RTL and English LTR. The light animates only its transform; there is no animated filter, blur, shadow, background-position or layout property. No indiscriminate `will-change` is added.

## Central tokens

`src/config/motion.ts` defines every camera timing and amplitude; `Hero.astro` emits scoped CSS variables. The camera starts after 900ms, allowing the existing one-time text sequence to settle while the image remains immediately painted.

| Viewport          | Scale start / middle / peak | Total horizontal / vertical travel |
| ----------------- | --------------------------- | ---------------------------------- |
| Desktop >1100px   | 1.025 / 1.04 / 1.055        | 0.65% / 0.45%                      |
| Tablet 768–1100px | 1.015 / 1.025 / 1.035       | 0.35% / 0.25%                      |
| Mobile <768px     | 1.008 / 1.014 / 1.02        | 0.18% / 0.12%                      |

The 0% and 100% poses are identical. Intermediate 33%/66% poses create a slow closed camera path rather than an alternating two-position pan. `cubic-bezier(0.45, 0, 0.55, 1)` settles velocity at each segment boundary. Modest overscan prevents uncovered edges throughout the cycle.

## Accessibility and lifecycle

The existing shared motion observer already watches the Hero for navbar inversion. That same delivery now pauses the camera/light when the Hero leaves view. `visibilitychange` pauses hidden documents. No extra observer or scroll listener is introduced. Abortable listeners are cleaned up on pagehide/reinitialization; bfcache retains the user's explicit pause state.

The localized keyboard-accessible pause toggle uses `aria-pressed` and reserves no new layout space. Pause changes `animation-play-state`, preserving animation time; it does not remove/reapply the animation or reset transform. Reduced motion removes both continuous animations and hides the unnecessary control. Observer failure/no JavaScript leaves a static visible image and no unusable control. Mobile receives a much smaller movement; there is no unreliable device-performance detector or claim of physical-device testing.

## Validation and evidence

Focused browser cases cover Arabic/English at 320/375/390/768/1440/1920, real CSS progress, unchanged text/CTA geometry, keyboard pause/resume, offscreen lifecycle, two-cycle endpoint inspection, reduced motion and image coverage. A separate hidden-document test simulates visibility events; physical tab/device verification remains distinct.

Actual results, real-time multi-loop observation, a steady-state trace and paired local performance measurements are recorded in [QA_CHECKLIST.md](QA_CHECKLIST.md) and [MOTION_COVERAGE_MATRIX.md](MOTION_COVERAGE_MATRIX.md). Screenshots alone do not demonstrate animation quality. Field INP, physical-device GPU timing and Safari rendering must not be inferred from Chromium lab results.

| Locale / viewport | Before                                           | After                                          |
| ----------------- | ------------------------------------------------ | ---------------------------------------------- |
| Arabic / 390px    | [Before](evidence/cinematic-before-ar-390.webp)  | [After](evidence/cinematic-after-ar-390.webp)  |
| Arabic / 768px    | [Before](evidence/cinematic-before-ar-768.webp)  | [After](evidence/cinematic-after-ar-768.webp)  |
| Arabic / 1440px   | [Before](evidence/cinematic-before-ar-1440.webp) | [After](evidence/cinematic-after-ar-1440.webp) |
| English / 390px   | [Before](evidence/cinematic-before-en-390.webp)  | [After](evidence/cinematic-after-en-390.webp)  |
| English / 768px   | [Before](evidence/cinematic-before-en-768.webp)  | [After](evidence/cinematic-after-en-768.webp)  |
| English / 1440px  | [Before](evidence/cinematic-before-en-1440.webp) | [After](evidence/cinematic-after-en-1440.webp) |

[Actual approximately 13-second desktop recording](evidence/cinematic-hero-desktop.webm). The screenshots crop to the Hero; the recording preserves the normal page UI. Media are documentation evidence and are not shipped in the site's asset bundle. The original and new app builds use identical image files; no asset derivative was regenerated.

Changed application files: `src/sections/Hero.astro`, `src/styles/hero.css`, `src/styles/motion.css`, `src/config/motion.ts`, `src/scripts/motion.ts`. Focused browser coverage is in `tests/e2e/cinematic-hero.spec.ts`; the token safety budget extends `tests/unit/motion.test.ts`. An existing navbar test now retains its focus target rather than confusing current-section state with keyboard focus.

The latest explicit instruction limits this task to a reviewable feature branch/PR. Do not merge or deploy production without new approval.
