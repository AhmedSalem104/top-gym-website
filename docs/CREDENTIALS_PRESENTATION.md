# Certificate presentation — 6 November 2026

## Premium showcase revision

The new written brief supersedes the six-cell introduction/card layout below. The newly mentioned reference image is not attached or present in the known project assets; its file path has been requested. Work follows the explicit written specifications only, with visual-reference comparison pending. Do not claim to have inspected or matched that image. Initially review-only, this revision was subsequently authorized for merge and publication on 6 November 2026; see `DEPLOYMENT.md` for the owner's standing publishing preference.

Direction: a document-led showcase, with a full-width centered introduction above five authentic certificates. Desktop uses a twelve-column grid (three cards, then two centered); tablet uses two cards per row with a centered remainder; mobile uses one. Preserve DOM reading order and adapt to arbitrary certificate counts without duplicates.

```text
          label / heading / description / documented name
         [ certificate ] [ certificate ] [ certificate ]
                 [ certificate ] [ certificate ]
Mobile: introduction, then each full document card
```

Tokens: existing gold #E59500, canvas #0B0D0F, surface #17191C, ink #F8F9FA, muted #A6ABB2 and border #34383D; scoped card surface #1B1C1F and 16px corners from the owner's brief. Keep Cairo/Barlow Condensed/Chivo. Image-first cards use 12/16/24px spacing, large contain-fit frames and reserved action space. Existing documents stay unchanged; responsive copies derive only from the already redacted full-size files.

Reuse shared 580ms image entrances and bounded 80ms stagger. Hover duration derives from shared micro + stagger tokens (280ms), with independent 4px `translate`, 1.025 image scale inside protected padding, and opacity on a static glow layer. Keyboard focus gets equivalent feedback; touch and reduced-motion users always see the action. No new observer or animation dependency.

The shared lightbox exposes certificate-only original-size zoom and a scrollable document stage. Normal photo-gallery controls remain unchanged. Arrow keys pan a focused enlarged document; elsewhere they retain the existing RTL-aware previous/next behavior. Escape closes the native dialog, Tab stays within visible controls and focus returns to the originating card. Without JavaScript, each card remains a direct link to its complete document.

Mobile frames follow each document's intrinsic proportions to avoid large letterboxed gaps; tablet/desktop frames keep consistent heights for aligned rows. Images use `object-fit: contain`, reserved dimensions and 12px inner padding that protects all document edges during the 1.025 hover scale. The action remains visible on touch, keyboard focus and reduced-motion devices.

### Sources and responsive copies

The five existing public full-size, privacy-redacted WebP files and 680px previews are byte-unchanged. `scripts/prepare-certificate-previews.mjs <source-root>` checks the five supplied enhanced-source hashes and derives 320px/960px WebP copies from those existing redacted full-size files. `asset-manifest.json` records source/output hashes, dimensions, bytes and resize-only processing. Original files remain outside Git. No crop, perspective reconstruction, text editing or AI image generation was applied.

Published sources remain: `03_pbls_personal_trainer.jpg`, `04_tass_fitness_trainer.jpg`, `02_tass_nutrition.jpg`, `05_pbls_nutrition.jpg`, and `06_titanium_certificate.jpg` under the supplied `media/certificates/` directory. Titles, issuers, the exact holder name and the documented 8 February–6 April 2023 training period are unchanged. These are supplied enhanced copies; archival-original comparison and independent accreditation verification have not been completed.

### Review evidence

Twenty actual before/after section captures cover both languages at 320/390/768/1440/1920px: `evidence/credentials-premium-{before,after}-{ar,en}-{width}.webp`. Section captures hide only fixed navigation/contact chrome and settle motion; normal-motion interaction recording and focused browser tests verify behavior separately. See the latest `QA_CHECKLIST.md` entry for actual results and performance limits.

Representative comparison: [before desktop](evidence/credentials-premium-before-ar-1440.webp), [after desktop](evidence/credentials-premium-after-ar-1440.webp), [before mobile](evidence/credentials-premium-before-ar-390.webp), [after mobile](evidence/credentials-premium-after-ar-390.webp), [English tablet](evidence/credentials-premium-after-en-768.webp).

## Earlier revision (superseded layout)

The owner requested removing the Hero promotional caption and About's equipment/colour paragraph, and improving the credentials section. Remove the corresponding English copy as well so the shared pages stay consistent. The Hero source and license remain in `hero-media.json`; its alternative text still describes the photograph as promotional. No claim that the stock photograph depicts TOP GYM is added.

## Visual direction

An editorial certificate gallery in the existing black-and-gold identity. The introduction occupies the first cell alongside five certificate cards, producing a balanced six-cell composition instead of a disconnected full-width heading and an incomplete final row. Desktop uses three columns, tablet two and mobile one. Titles lead each document; complete uncropped previews, dates and visible enlargement controls remain available.

```text
Desktop: introduction | certificate | certificate
         certificate  | certificate | certificate
Mobile:  introduction, then each complete certificate card
```

Use existing tokens only: gold #E59500, canvas #0B0D0F, surface #17191C, text #F8F9FA, muted #A6ABB2 and border #34383D. Cairo remains the Arabic typeface; Barlow Condensed and Chivo remain the English display/body faces. Spacing uses 12/16/24/32px intervals. The distinguishing detail is the document-led gallery with the introduction integrated into its reading order.

Reuse shared motion and native lightbox behavior. Preserve every document image, title, issuer, training date and redaction. Do not infer employment or identity from the certificate name. Verification evidence is recorded in `QA_CHECKLIST.md` and `PROGRESS.md` after browser review.
