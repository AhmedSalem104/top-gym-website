# Hero and navigation refinement — 5 November 2026

## Approved direction

### Full-width owner-supplied Hero — 6 November 2026

The latest brief supersedes the split layout and long service list below. Purpose: give TOP GYM an immersive opening impression with a clear membership/directions path. The owner then explicitly selected `Luxury Gym with Golden Top Gym Emblem.png` as the background. Direction: cinematic, restrained black-and-gold, one edge-to-edge media layer and a compact editorial content block at the reading edge (right in Arabic, left in English).

Tokens remain the existing gold #E59500, canvas #0B0D0F, surface #17191C, ink #F8F9FA and muted #A6ABB2. Cairo is Arabic display/body, Barlow Condensed is English display and Chivo is brand/body. Use 12/16/24/32/48/64px spacing, fluid 32–76px headings, existing 200ms CTA feedback and the shared first-paint motion sequence. The signature is black equipment and gold columns filling the entire Hero behind the typography, without a boxed image or frame.

```text
Desktop RTL: | owner-supplied gym visual across the entire width     |
             | exposed equipment      [ TOP GYM / experience ]      |
             |                        [ short copy / three CTAs ]   |
             | verified facility links across the bottom             |
Mobile:      | full-width portrait crop, content layered above it     |
             | brand / heading / short copy / actions / facilities    |
```

Image selection: the owner's newly supplied PNG replaces the earlier candidate real-gym cable-machine photo. The source is 1672×940, 2,052,653 bytes; its SHA-256 and output hashes are recorded in `hero-fullbleed-media.json` and `asset-manifest.json`. It is an owner-authorized promotional visual, **not independently verified as a photograph of TOP GYM's premises**. Alternative text preserves this distinction. No people were observed. The original site logo and real facility/gallery photos remain unchanged; the source's embedded emblem is not reconstructed.

`scripts/prepare-fullbleed-hero.mjs <source-png>` validates the reviewed source hash before producing ten separate AVIF/WebP copies. Wide variants are 768/1200/1672px, with resize/encoding only; mobile variants are 360/704px using the recorded 704×940 crop at x350/y0. No upscaling, recoloring, retouching or generative edit is performed. The original PNG remains unchanged in Downloads, outside Git. Largest AVIF is 103,580 bytes; mobile 704px AVIF is 44,291 bytes. Previous Hero assets remain preserved but are no longer referenced here.

The short Arabic paragraph is the owner's supplied training/follow-up/membership invitation, with a natural English equivalent. Existing `business.hero` facts remain unchanged; the presentation no longer enumerates four service rows. The nine-year claim remains owner-supplied. All three real CTAs and facility links retain their targets. Preserve the navbar, Hero-boundary observation, footer and every unrelated section.

Media uses a single art-directed `picture`, viewport-based source sizes, eager loading and high fetch priority. On narrow screens the source-size floor accounts for cover cropping in the taller Hero. The section reserves its layout independently of image loading. Dark gradients follow text direction and become a vertical scrim on mobile. The existing 12px/560ms opaque first-paint sequence keeps LCP image/headline available; reduced motion disables movement. No client script, observer or animation dependency is added.

Before/after captures and actual checks are recorded in the latest QA/progress entry. The owner's standing authorization covers the protected-PR merge and Vercel publication after verification.

| View                    | Before                                                | After                                               |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Arabic desktop, 1440px  | [Before](evidence/hero-fullbleed-before-ar-1440.webp) | [After](evidence/hero-fullbleed-after-ar-1440.webp) |
| Arabic mobile, 390px    | [Before](evidence/hero-fullbleed-before-ar-390.webp)  | [After](evidence/hero-fullbleed-after-ar-390.webp)  |
| English desktop, 1440px | [Before](evidence/hero-fullbleed-before-en-1440.webp) | [After](evidence/hero-fullbleed-after-en-1440.webp) |
| English mobile, 390px   | [Before](evidence/hero-fullbleed-before-en-390.webp)  | [After](evidence/hero-fullbleed-after-en-390.webp)  |

### Historical split-layout revisions

### Brand-label legibility — 6 November 2026

The owner requested making “TOP GYM 💪” clearer. Increase the existing gold Chivo label from 12px to a fluid 20–26px, use a compact 1.2 line height, and size the decorative emoji at 24–28px. Retain the original label/heading hierarchy, 12px gap, restrained gold line and shared entrance. Remove conflicting mobile/RTL 12px overrides so both languages receive the same improvement. No content, image, logo or interaction changes are required.

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
