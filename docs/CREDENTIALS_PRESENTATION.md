# Certificate presentation — 6 November 2026

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
