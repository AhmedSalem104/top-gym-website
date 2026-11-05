# Apex Gold implementation

## Reference and direction

Primary: `top_gym_refined_desktop_landing_page_apex_gold_2/code.html` and its 1600×12362 screenshot. Supporting references: Gold Desktop 1, Gold Mobile HTML and `apex_gold_kinetic/DESIGN.md`. All archive entries have the same export timestamp; `_2` is the most developed gold variant, not proven chronologically newest. The mobile screenshot is only 37×1600 and unsuitable for a precise pixel comparison; use its HTML and responsive QA.

The page preserves the cinematic dark hero, condensed uppercase English headings, gold emphasis, restrained frames, alternating dark sections, photography-led equipment cards, asymmetric gallery, pricing cards, timetable/contact panels and final centered CTA. The signature is the bold white/gold headline. The owner-requested Hero redesign now uses an asymmetric copy/photograph grid and a licensed, clearly labeled wide-gym promotional photograph. Actual black equipment and gold columns remain in the facilities/gallery sections. See `HERO_REDESIGN.md`.

```text
Header: logo | anchored navigation | EN/AR | dark call | gold WhatsApp group
Hero: headline + labeled promotional image + actions
      equipment overview rail
About: image | training story
Equipment: three real equipment cards
Credentials: only when documentary publishing is approved
Gallery: lead image + four detail images
Pricing: duration control + two packages + comparison
Hours: day-by-day schedule | contact invitation
Location: directions | actual gym photo
Contact: two call cards | WhatsApp group
Final CTA / footer / mobile contact bar
```

## Tokens

| Role                     | Value                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| Gold / hover             | `#E59500` / `#FFAD26`                                             |
| Canvas / section / card  | `#0B0D0F` / `#17191C` / `#24272B`                                 |
| Primary / secondary text | `#F8F9FA` / `#A6ABB2`                                             |
| Borders                  | `#34383D`                                                         |
| Radii                    | 4px controls/cards; 8px emphasized panels                         |
| Layout                   | 1320px content maximum; 20–64px gutters; 64–112px section spacing |

Fonts: Barlow Condensed 600/700/800 for English display, Chivo 400/600 for English body, Cairo Variable for Arabic. Arabic has its own line-height and scale. Fonts are local. Gold buttons use dark text. Green in the actual turf photography is retained; green UI accents are not used.

## Responsive and interaction rules

Desktop navigation becomes a disclosure menu below 1360px so the longer truthful bilingual group CTA fits without crowding. The navbar follows the primary export's action hierarchy, segmented language switch and single-column mobile drawer. The original square logo is preserved; the unsupported men-only tagline is omitted. Mobile language controls live inside the drawer. Most card layouts stack below 768px. At 320px, photo tiles stack and contact content adapts. Use logical margins/borders for RTL. Respect safe-area insets for the mobile call/group bar. Header anchors reserve scroll offset. Shared native motion follows `MOTION_SYSTEM.md`; reduced-motion disables it. Home now links to the existing #top anchor. After the Hero leaves the viewport, the owner-requested header palette becomes #FFAD26 with black links and focus indicators; returning to the Hero restores the dark palette. Existing section targets are preserved.

## Intentional source differences

- Real portrait equipment photos replace generated interiors in facilities/gallery. The owner-requested Risen Wang / Unsplash Hero is a separate promotional gym photograph with responsive sizing and no upscaling.
- Real 3D logo replaces the broken placeholder logo; its background remains.
- Three verified equipment categories replace unsupported wellness/recovery, free-weight inventory, equipment brands, awards and coaching claims.
- Two real packages and six exact durations replace three fictional pricing tiers.
- Real contact cards replace the fake booking form and placeholder direct WhatsApp chat.
- The source's men-only business assertion, CSCS/ISSA assertions and generated certificates are removed because the supplied evidence does not support them.
- The requested live Google map uses the verified listing, with the entire preview linking to the supplied Maps URL. No address is invented.
- Five supplied enhanced certificates now appear in responsive framed cards with full-document previews, dated training periods and accessible enlargement. Registration numbers are redacted in the actual files.
- The WhatsApp contact panel includes an explicit high-contrast QR code and a normal join action.
- Body size and focus/touch targets are enlarged where necessary for readability/accessibility.

Screenshots and visual-review findings belong in `docs/evidence/` and `QA_CHECKLIST.md`.

## Requested footer refinement

The existing final CTA is now a bordered charcoal panel with one gold edge, the requested bilingual journey headline and membership/call/directions actions. The footer uses four desktop columns, two tablet columns and one mobile column with a two-column quick-link list. The actual logo preserves its proportions. Restrained gold details, 200ms interactions and shared 12px reveals connect it to the site. Hours derive from business configuration with the confirmation note intact.
