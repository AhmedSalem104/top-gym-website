# TOP GYM motion system

## Architecture

The site remains static Astro with shared Arabic/English components. Native Web Animations own viewport entrances/dialogs; CSS owns first-paint hero motion and hover/focus/press states. All share the same configuration tokens. There are no animation packages, hydration islands, scroll handlers or perpetual animation loops.

- `src/config/motion.ts`: timings, easing, distances, variants, viewport trigger and stagger budget. `Base.astro` emits the same tokens as CSS variables.
- `src/scripts/motion.ts`: one IntersectionObserver shared by all reveals and the Hero boundary; one child-list MutationObserver for new/remounted content; delegated keyboard-focus handling; cancellation and lifecycle cleanup. After the Hero leaves the viewport above, the header becomes #FFAD26 with black links and focus rings. Its height remains unchanged.
- `src/styles/motion.css`: button/card/image/navigation micro-interactions and reduced-motion rules.
- `src/scripts/site.ts`: existing menu, price and lightbox interactions call the shared motion primitives.

`initMotion()` is idempotent. It disposes old observers/listeners before initializing. `pagehide` disconnects observers and cancels active animations; a persisted `pageshow` reconnects without replaying completed entrances. WeakSet tracking does not retain removed nodes. Removed pending elements are unobserved; removed active elements are cancelled.

Native [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) supplies viewport entries without synchronous layout reads in a scroll handler. [Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished) settles transitions; cancellation is caught so it cannot become an unhandled rejection.

## Tokens and variants

| Primitive        |     Duration | Movement                       | Usage                                   |
| ---------------- | -----------: | ------------------------------ | --------------------------------------- |
| `heading`        |       540 ms | opacity + 12 px vertical       | labels and headings                     |
| `reveal`         |       560 ms | opacity + 16 px vertical       | copy, panels, lists and cards           |
| `image`          |       580 ms | opacity + 12 px vertical       | facility, gallery and certificate cards |
| `fade`           |       560 ms | opacity only                   | supporting notes/footer                 |
| `hero`           |       560 ms | 12 px vertical, fully opaque   | navigation and LCP heading              |
| `hero-image`     |       580 ms | 1.008 to 1 scale, fully opaque | existing hero photograph                |
| `enter` / `exit` | 260 / 160 ms | opacity + 12 / −8 px           | disclosure menu and native dialog       |
| `feedback`       |       200 ms | fully opaque + 2 px            | immediately updated price/image         |

Ease-out: `cubic-bezier(0.22, 1, 0.36, 1)`; exit: `cubic-bezier(0.4, 0, 1, 1)`. Stagger is 80 ms, capped at 240 ms. Only nearby elements entering in the same observer delivery share a stagger; later rows start a fresh short sequence. Content groups use a two-step lead after section headings. No bounce, blur, shaking or scroll-linked parallax.

## Viewport and entrance behavior

The observer uses threshold 0 with a `0px 0px 24px 0px` root margin. It prepares entrances just before first visibility at the viewport edge. An opacity entrance starts only while the element's top is still outside the visible viewport. Already-visible content from late initialization, fast scrolling, anchors or dynamic insertion settles immediately without being hidden. This deliberately prioritizes continuity over forcing a fade onto painted content. Elements are observed individually, unobserved once and never reset on return scrolling. The diagnostic states `pending`, `running` and `complete` never hide content in CSS.

Hero/header motion is CSS-owned from first paint and excluded from observer animation. Eyebrow starts immediately, heading follows at 80ms, copy at 160ms, CTAs and supporting visuals at 240ms. All remain opaque, including the LCP heading and image; no load gate or blank state is introduced. The full-width Hero revision retains this sequence: its background picture scales gently within a clipped, reserved section while the static scrim and content remain separate layers. It adds no motion controller or observer. CSS individual `translate` provides 1px hover feedback independently of entrance `transform`, preventing competing property ownership.

The DOM order defines each stagger. The existing grids mirror naturally in RTL, so Arabic reads from right to left and English from left to right without sorting geometry or reversing DOM/accessibility order. Navigation underline origin follows direction; other motion is vertical.

## Adding a future section

Use the existing `SectionHeading`, which supplies label → heading → description motion. Mark meaningful content rather than every nested word:

```astro
<SectionHeading eyebrow={copy.label} title={copy.title} description={copy.text} />
<div class="existing-grid" data-motion-group data-motion-step="2">
  {items.map((item) => (
    <article data-motion="reveal">{item.title}</article>
  ))}
</div>
```

Use `image` for image-led cards, `footer` for subtle footer groups, and `fade` for notes. Avoid nested animated parents/children. `data-motion-step` optionally adds bounded stagger steps. Hero CSS ownership is limited to the header/hero. Do not add hidden styles or arbitrary inline timings.

New nodes with `data-motion` register automatically. For attributes added to an existing node, dispatch `document.dispatchEvent(new Event('motion:refresh'))`. Repeated refresh events do not duplicate observers or replay seen items. Changed values should update the DOM first and call `playMotion(element, 'feedback')`; prices never wait for an animation.

## Accessibility and resilience

- With JavaScript disabled, all server-rendered text/images remain visible and indexable; certificate/gallery anchors still open their files and the full price table still works.
- If IntersectionObserver construction fails or an animation cannot run, content remains visible. No permanent hidden state or timeout-dependent visibility is used.
- Reduced motion is checked initially and on changes. It cancels running motion, completes pending reveals, disables hover transforms/transitions and uses instant anchor scrolling. Re-enabling motion does not replay completed items.
- Focusing an element completes/cancels its pending/active entrance immediately. Focus rings are never animated away.
- The mobile menu is a nonmodal disclosure. Opening focuses its first link; Escape restores the trigger; selecting an anchor focuses the destination; leaving the header closes it. Closing uses `inert` and a revision guard so rapid toggles cannot hide a reopened menu. Body scrolling is not locked by the menu.
- Gallery and certificates keep the native modal dialog, keyboard arrows, focus containment/return and Escape/backdrop closing. A short cancellable exit completes before closing. Reduced motion closes immediately.

## Performance and verification

Entrances animate only transform/opacity, release native animation objects on completion and apply no permanent `will-change`. Hover colors/borders use short transitions. The sticky header changes a shadow layer's opacity without changing height; `scrollbar-gutter: stable` prevents modal scrollbar width shifts.

Run `npm run test:all` for unit safety budgets, actual viewport coverage, no replay, RTL stagger, dynamic registration, cleanup, rapid menu toggles, reduced motion, observer failure and original functionality. The six coverage scenarios span both languages at 390/768/1440 px. Existing layout checks also cover 320/1920 px.

Reproduce performance with a production preview:

```sh
npm run build
npm run preview -- --port 4323
node scripts/measure-performance.mjs http://127.0.0.1:4323
node scripts/measure-motion.mjs http://127.0.0.1:4323
```

`evidence/motion-before-lighthouse.json` preserves the pre-motion local lab result. `evidence/lighthouse-summary.json` is the final build's lab result. `evidence/motion-performance.json` records 6× CPU slowdown, throttled network, slow/fast/down/up scrolling, layout shifts, long tasks and frame intervals. Its bounded requestAnimationFrame loop is test instrumentation only, never shipped. rAF cadence is not a GPU frame-time measurement or a real-device FPS guarantee. See `MOTION_COVERAGE_MATRIX.md` and `QA_CHECKLIST.md` for the actual verification record and limitations.

## Navigation and membership follow-up

Active section tracking uses its own single continuous observer in `navigation.ts`, independently of the once-only reveal observer. It shares gold state styling with the mobile underline and adds no scroll loop or animation library. The official PDF copy and preview adopt `reveal` / `image`; duration tabs use centralized micro-transition tokens and immediate price feedback. The motion observer-count test distinguishes its root margin from the navigation observer.

## Active navigation spotlight

A single decorative `nav-spotlight` inside the existing desktop nav moves via `transform: translateX`; its CSS pseudo-elements draw a 28 × 2 px gold light and a static low-opacity gradient beam. No animated blur, width, layout or continuous frame loop is used. Inactive hover/focus gets a dimmer 20 px top line. Below the existing 1360 px desktop breakpoint, the shared mobile nav uses its gold active underline. Focus rings remain independent.

`motion.duration.navigation` sets a 340ms transition. The first placement and geometry corrections occur with transitions disabled; two finite animation-frame callbacks enable subsequent glides after geometry is established. Font readiness/loading completion and one nav ResizeObserver update alignment using physical offsets for RTL/LTR. A 110ms stability window, 150ms window resize debounce and 1800ms interrupted-anchor fallback prevent switching during native anchor travel. Arrival, deliberate wheel/touch/keyboard interruption or the bounded fallback releases the clicked target. Timers, callbacks and observers are disposed on pagehide and restored for bfcache. Reduced motion removes transitions without removing the indicator.

## Calm-motion audit and footer refinement

The before audit recorded 80–81 opacity-zero starts on already visible elements per scenario. The old 8% threshold/inset waited until content was visible before hiding it, with up to 320ms delay; above-fold copy also reset after script initialization. CSS hover transforms competed with entrance transforms, menu reversals restarted from fixed endpoints, and the spotlight could animate its initial position from x=0. These causes are corrected by the ownership/edge-trigger rules above. Interrupted native transitions sample their painted opacity/transform before cancellation; the replacement continues from that frame. The read occurs only on an interrupted user interaction, never per scroll frame. Feedback stays opaque and only moves 2px.

The footer uses the shared `footer` variant (12px/560ms), 80ms stagger and 240ms cap. Brand, headings, links, configured hours and bottom bar enter once. Its semantic navigation, native phone/social/directions links and `#top` control work without JavaScript. Back to Top follows global smooth scrolling and becomes instant for reduced motion. Hour groups are derived from consecutive rows in business configuration; midnight and the confirmation note are preserved.

`evidence/motion-jerk-audit.json` and `evidence/motion-calm-audit.json` preserve before/after results: zero visible opacity resets after the fix in all six locale/viewport scenarios. `footer-calm.spec.ts` tests the footer, real edge activation, fast-anchor fallback, initial spotlight placement and menu reversal continuity. Before/after screenshots and recordings use `footer-before-*`, `footer-after-*`, `footer-cta-before-*`, `footer-cta-after-*`, `calm-before-*` and `calm-after-*`. Full-section screenshots exclude sticky chrome; a negative-position skip-link screenshot artifact was excluded after confirming it stays outside the actual viewport when unfocused.

Current lab measurements are retained separately in `evidence/calm-motion-performance.json`, `evidence/calm-lighthouse-summary.json` and `evidence/calm-lighthouse-repeat-summary.json`. Earlier evidence remains historical. See `QA_CHECKLIST.md` for actual numbers, local-run variability and the remaining live Google-map cost.

The initial hero image uses the 560ms CSS hero duration; the exported native `hero-image` variant retains the 580ms image duration for callers outside that CSS-owned initial sequence.

## Premium certificate showcase

The centered label/heading/description/name reuse `heading` and `reveal`; certificate articles reuse `image` (12px/580ms) with the existing 80ms stagger and 240ms cap. The privacy note retains `fade`. No new observer, loop or animation dependency is introduced. Existing visible-content, once-only, dynamic-content and reduced-motion safeguards still apply.

`credentials.css` owns certificate micro-interactions, replacing only their old generic 1px card-hover rules. Duration is `--motion-micro + --motion-step` (280ms) with shared easing. A 4px CSS `translate` is independent of the observer's `transform`, preventing hover/reveal ownership conflicts. The image scales to 1.025 within protected contain-fit padding; a static shadow layer fades through opacity, without animated blur/shadow geometry. Border color transitions to brand gold. The reserved action row fades/slides 4px; the expand icon moves 2px. Keyboard focus gets equivalent feedback, and touch/reduced-motion users see the action without hover.

The existing native lightbox retains shared open/close/image feedback. Certificate-only zoom changes between fit and natural-size inspection immediately, without an animated layout transition. A focusable native scroll region supports keyboard/touch panning; fit/next/previous/close reset zoom. Normal gym photographs do not expose the zoom control. See `CREDENTIALS_PRESENTATION.md` for provenance and `MOTION_COVERAGE_MATRIX.md` for verification.
