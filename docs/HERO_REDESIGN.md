# Hero and navigation refinement — 5 November 2026

## Approved direction

### Owner's copy revision — 6 November 2026

The owner replaced the earlier “Your strength starts here” text with TOP GYM, “9 سنين خبرة وثقة”, four service statements, and “ابدأ رحلتك معانا وخلي هدفك خطتنا”. The new layout presents a compact TOP GYM/💪 label, a two-line white/gold heading, four aligned service rows and a separated invitation before the existing three actions. The owner-provided emojis are decorative (`aria-hidden`); the complete meaning remains in readable text. Arabic and English share this composition.

Keep the existing 45:55 split, photograph, palette and font families. Mobile stacks copy, actions and photograph. The signature is a clear white/gold experience headline with a calm, readable service list, not additional cards or animated decorations. Reuse the existing color tokens and 8/12/16/20/24px spacing rhythm. All service rows share one existing entrance, keeping LCP content painted and avoiding competing stagger systems.

```text
TOP GYM 💪
9 YEARS / EXPERIENCE & TRUST       [ existing gym photograph ]
4 service rows
invitation
memberships / directions / gallery
```

`business.hero` centralizes the supplied nine-year claim and bilingual services. These are owner-provided marketing statements dated 2026-11-06, not qualifications inferred from the certificate images. No practitioners, medical licenses, military affiliations, guaranteed outcomes or founding date were added. The Arabic service wording is preserved; the English version translates it. Original certificate names, issuers and dates remain unchanged.

This revision supersedes the old headline description below. Before/after evidence uses `hero-copy-{before,after}-{ar,en}-{390,768,1440}.webp`; all seven existing Hero viewport checks remain in the browser suite.

The owner requested a new split Hero, then explicitly replaced the original-photo constraint with a new high-quality photograph of a spacious real gym from an external source. This supersedes the old hooded-athlete presentation. Other page sections and business facts are preserved.

The composition uses a 45:55 copy/image grid, mirrored by document direction. Arabic copy sits on the right; English copy sits on the left. A two-line white/gold headline, short supporting copy and membership/directions/gallery actions lead the page. Mobile uses copy and actions first, then the photograph. The original logo remains in the header.

```text
Desktop: [ copy + 3 actions, 45% ] [ wide photograph, 55% ]
         [ verified equipment categories                ]
Mobile:  eyebrow / two-line heading / copy / actions
         photograph / categories
```

Tokens remain #E59500 gold, #0B0D0F canvas, existing Cairo/Barlow Condensed/Chivo fonts. Hero-specific styles are in `src/styles/hero.css`; superseded Hero rules were removed from global CSS to prevent conflicting breakpoints. No other section was redesigned.

## Photograph and provenance

- Photograph: [Risen Wang — gym equipment inside room](https://unsplash.com/photos/gym-equipment-inside-room-20jX9b35r_M).
- [Unsplash License](https://unsplash.com/license), reviewed 5 November 2026, permits commercial use. No endorsement is implied.
- Reviewed master: 4000 × 2997 JPEG, preserved privately. SHA-256 and exact source URL are in `hero-media.json` and `asset-manifest.json`.
- No people observed, including reflections. The source is already monochrome. Resize/encoding only; no generative edits, invented equipment or crops.
- Responsive AVIF/WebP at 480/800/1200/1600px. AVIF sizes: 18.8/37.5/70.0/110.6 KB. Primary image is eager/high priority with reserved dimensions.
- The owner requested removing the visible caption on 6 November. The image remains identified as promotional in its alternative text and provenance documentation; it is not a photograph of TOP GYM's premises. Actual gym photographs remain in Facilities/Gallery.
- `scripts/prepare-wide-hero.mjs <master>` verifies the reviewed hash before regenerating derivatives. The old Pinterest provenance remains historical and its image is no longer referenced by the Hero.

## Navigation and pricing follow-ups

Home / الرئيسية links to the existing body `#top` anchor. ScrollSpy maps the Hero to Home without observing the entire body. Clicking Home retains its active state until the document reaches the top; an already-visible sliver of Hero above About must not prematurely release the anchor lock.

The shared motion observer watches the whole Hero with `data-header-boundary`. A 1px sentinel was rejected after a browser test showed that instant jumps can skip it entirely, leaving the header dark. Observing the Hero itself handles fast jumps and tall mobile layouts. The sticky header remains dark while the Hero is still visible, becomes #FFAD26 with black links after the Hero passes, and restores its dark palette on return. Header dimensions stay fixed. Desktop spotlight, mobile underline, language controls, call/group buttons and focus rings all adapt to the inverted palette. No additional observer or scroll listener is introduced. If JavaScript/observers fail, the original dark header remains usable.

Labels are now نص شهر / Half month and شهرين / 2 months. Duration identifiers, prices and the original downloadable PDF are unchanged. The language switch retains AR/EN visually; accessible names include those visible abbreviations plus the full language names, correcting a verified label/name mismatch.

## Motion and evidence

Shared 560ms entrance, 80ms stagger capped at 240ms, 12px movement and existing ease-out. Above-the-fold heading/image remain painted throughout; reduced motion removes transitions. See `MOTION_SYSTEM.md` and `MOTION_COVERAGE_MATRIX.md`.

Before/after captures: `evidence/hero-authentic-{before,after}-{ar,en}-{320,375,390,768,1366,1440,1920}.webp`. The historical filename prefix reflects the initial brief, not a claim about the new stock photograph. These are actual section screenshots with fixed chrome hidden solely for capture; separate navigation screenshots retain the real header.

Validation results and measurement limitations are recorded in the latest `QA_CHECKLIST.md` and `PROGRESS.md` entries. The owner authorized publication on 6 November; PR #13 merged at ddd9bc871d83440d8bb15902a16f2531acac2a1b and Vercel production was verified with 13 live browser checks.
