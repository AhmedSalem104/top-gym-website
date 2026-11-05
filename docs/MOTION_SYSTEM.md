# TOP GYM motion system

## Architecture

The site remains static Astro with shared Arabic/English components. Motion uses native Web Animations for interruptible entrances/dialogs and CSS transitions for hover/focus/press states. There are no animation packages, hydration islands, scroll handlers or perpetual animation loops.

- `src/config/motion.ts`: timings, easing, distances, variants, viewport trigger and stagger budget. `Base.astro` emits the same tokens as CSS variables.
- `src/scripts/motion.ts`: one IntersectionObserver shared by all reveals and the header shadow sentinel; one child-list MutationObserver for new/remounted content; delegated keyboard-focus handling; cancellation and lifecycle cleanup.
- `src/styles/motion.css`: button/card/image/navigation micro-interactions and reduced-motion rules.
- `src/scripts/site.ts`: existing menu, price and lightbox interactions call the shared motion primitives.

`initMotion()` is idempotent. It disposes old observers/listeners before initializing. `pagehide` disconnects observers and cancels active animations; a persisted `pageshow` reconnects without replaying completed entrances. WeakSet tracking does not retain removed nodes. Removed pending elements are unobserved; removed active elements are cancelled.

Native [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) supplies viewport entries without synchronous layout reads in a scroll handler. [Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished) settles transitions; cancellation is caught so it cannot become an unhandled rejection.

## Tokens and variants

| Primitive        |     Duration | Movement                       | Usage                                   |
| ---------------- | -----------: | ------------------------------ | --------------------------------------- |
| `heading`        |       480 ms | opacity + 12 px vertical       | labels and headings                     |
| `reveal`         |       560 ms | opacity + 20 px vertical       | copy, panels, lists and cards           |
| `image`          |       680 ms | opacity + 16 px vertical       | facility, gallery and certificate cards |
| `fade`           |       560 ms | opacity only                   | supporting notes/footer                 |
| `hero`           |       600 ms | 12 px vertical, fully opaque   | navigation and LCP heading              |
| `hero-image`     |       680 ms | 1.018 to 1 scale, fully opaque | existing hero photograph                |
| `enter` / `exit` | 260 / 160 ms | opacity + 12 / −8 px           | disclosure menu and native dialog       |
| `feedback`       |       180 ms | opacity 0.65 + 4 px            | immediately updated price/image         |

Ease-out: `cubic-bezier(0.22, 1, 0.36, 1)`; exit: `cubic-bezier(0.4, 0, 1, 1)`. Stagger is 80 ms, capped at 320 ms. Only nearby elements entering in the same observer delivery share a stagger; later rows start a fresh short sequence. Content groups use a two-step lead after section headings. No bounce, blur, shaking or scroll-linked parallax.

## Viewport and entrance behavior

The observer uses an 8% threshold with a `0px 0px -24px 0px` root margin. Elements are observed individually, so a tall section does not reveal its offscreen cards at once. Completion unobserves the element. A diagnostic `data-motion-state` is `pending`, `running` or `complete`; **none of these states hides content in CSS**.

The initial hero groups sequence navigation, eyebrow/heading, supporting text and CTAs. The heading and image remain opaque throughout; there is no image-load gate, loading screen or delayed LCP paint. The image settles gently while text enters. Internal anchors and restored scroll positions use the same actual-viewport behavior.

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

Use `image` for image-led cards, `fade` for subtle supporting content. Avoid nesting an animated card inside an animated parent. `data-motion-step` optionally adds stagger steps and remains subject to the global cap. Use `hero` only when LCP content must remain fully painted. Do not add hidden styles or inline animation timings.

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
