# Apex Gold implementation

## Reference and direction

Primary: `top_gym_refined_desktop_landing_page_apex_gold_2/code.html` and its 1600×12362 screenshot. Supporting references: Gold Desktop 1, Gold Mobile HTML and `apex_gold_kinetic/DESIGN.md`. All archive entries have the same export timestamp; `_2` is the most developed gold variant, not proven chronologically newest. The mobile screenshot is only 37×1600 and unsuitable for a precise pixel comparison; use its HTML and responsive QA.

The page preserves the cinematic dark hero, condensed uppercase English headings, gold emphasis, restrained frames, alternating dark sections, photography-led equipment cards, asymmetric gallery, pricing cards, timetable/contact panels and final centered CTA. The signature is the bold white/gold headline over actual black equipment and gold columns.

```text
Header: logo | anchored navigation | language | call
Hero: headline + real gym image + actions
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

Desktop navigation becomes a disclosure menu below 1200px. Most card layouts stack below 768px. At 320px, photo tiles stack and contact content adapts. Use logical margins/borders for RTL. Respect safe-area insets for the mobile call/group bar. Header anchors reserve scroll offset. Motion is limited to short hover feedback; reduced-motion disables it.

## Intentional source differences

- Real portrait equipment photos replace generated wide interiors/athlete imagery. Crops preserve visible equipment; the dialog shows complete photographs.
- Real 3D logo replaces the broken placeholder logo; its background remains.
- Three verified equipment categories replace unsupported wellness/recovery, free-weight inventory, equipment brands, awards and coaching claims.
- Two real packages and six exact durations replace three fictional pricing tiers.
- Real contact cards replace the fake booking form and placeholder direct WhatsApp chat.
- The source's men-only business assertion, CSCS/ISSA assertions and generated certificates are removed because the supplied evidence does not support them.
- A real Maps link and gym image replace the unverified map/placeholder address.
- Certificates remain hidden until original and privacy review; no empty frame is presented.
- Body size and focus/touch targets are enlarged where necessary for readability/accessibility.

Screenshots and visual-review findings belong in `docs/evidence/` and `QA_CHECKLIST.md`.
