# Source inventory and publishing decisions

The machine-readable [asset manifest](asset-manifest.json) inventories 32 extracted files with SHA-256 hashes, bytes, image dimensions, duplicates, destination paths and decisions. Archives and original PDF are not public repository content.

## Integrated assets

| Source                            | Destination / usage                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `brand/top_gym_logo_original.jpg` | `top-gym-logo.webp`, favicon, social-share JPEG; original proportions/background retained |
| `gym_photos/01_chest_press.jpg`   | `chest-press-*`; facilities, gallery, location                                            |
| `gym_photos/02_cardio_room.jpg`   | `cardio-room-*`; facilities and gallery                                                   |
| `gym_photos/03_cable_machine.jpg` | `cable-machine-*`; hero, facilities, gallery                                              |
| `gym_photos/04_leg_machine.jpg`   | `leg-machine-*`; gallery                                                                  |
| `gym_photos/05_leg_extension.jpg` | `leg-extension-*`; about and gallery                                                      |

All five enhanced photos were visually inspected at useful resolution, including posters and mirrors. No prohibited female imagery was observed. Male bodybuilding poster imagery is visible in some equipment photos. This is a human review, not an automated gender-classification claim. The archive README states these are conservative adjustments of owner-provided originals with no equipment added or replaced. Raw originals are still requested for archival comparison.

## Price source

Official one-page Arabic membership PDF dated **2026-11-05**, visually rendered and cross-checked. Twelve values:

| Duration           | Gym only (EGP) | Gym + cardio (EGP) |
| ------------------ | -------------: | -----------------: |
| 15 days            |            180 |                200 |
| 1 month            |            350 |                400 |
| 2 months / 60 days |            700 |                800 |
| 3 months           |          1,050 |              1,200 |
| 6 months           |          2,100 |              2,400 |
| 12 months          |          4,200 |              4,800 |

The PDF text layer reverses some Arabic numeric runs; visual inspection, not text extraction alone, was used. Prices in tests are an independent transcription of that rendered table. PDF authority applies to pricing, not to unsupported benefits.

## Certificate review — private source only

Eight supplied enhanced photographs are inventoried. The README asserts conservative sharpening/contrast and unchanged documentary text; original photographs have not been supplied for independent comparison. Several images contain personal registration numbers. No image or identifier has been published or committed. Titles below describe legible supplied copy and are **not an accreditation verification**.

| File                                   | Legible subject / organization                                          | Disposition                               |
| -------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `01_titanium_tass_cards.jpg`           | Titanium Gym / World Gym training statement with TASS/PBLS cards        | Contains extra personal identifiers; hold |
| `02_tass_nutrition.jpg`                | Sports Nutrition Specialist; Training Academy for Sports Science (TASS) | Hold for original/privacy review          |
| `03_pbls_personal_trainer.jpg`         | Certified Personal Trainer (Gym Coach); PBLS Academy                    | Hold for original/privacy review          |
| `04_tass_fitness_trainer.jpg`          | Certified Fitness Trainer; TASS                                         | Hold for original/privacy review          |
| `05_pbls_nutrition.jpg`                | Specialist in Sports Nutrition; PBLS Academy                            | Hold for original/privacy review          |
| `06_titanium_certificate.jpg`          | Titanium Gym Group in collaboration with World Gym training statement   | Hold for original/privacy review          |
| `07_pbls_nutrition_variant.jpg`        | PBLS nutrition variant; not assumed an additional qualification         | Hold; reconcile variant with original     |
| `08_pbls_personal_trainer_variant.jpg` | PBLS personal trainer variant; not assumed an additional qualification  | Hold; reconcile variant with original     |

The visible training period is 8 February–6 April 2023; confirm each original before treating it as an award/issue date. The holder supplied by the owner is Ahmed AbdElhamid Salem AbdElhamid Salem. Do not conflate that holder with the contact Ahmed or infer a current employment role.

To release: compare originals, verify exact titles/issuers/dates, confirm public use and role, prepare privacy-safe derivatives without changing documentary content, review the derivatives, add approved typed records to `business.trainer.credentials`, and verify both lightboxes. Existing `Credentials.astro` and shared dialog support this without layout duplication.

## Design source decisions

All six HTML variants were inspected for headings, sections, behaviors and images; both DESIGN.md files were read. Gold Desktop 2 is the primary reference. Elite variants use lime and are not used. Two elite HTML files are byte-identical (see manifest). Generated gym/certificate screenshots stay reference-only. No source prototype JavaScript or third-party placeholder images are shipped.

## Unresolved business content

- Original gym/certificate files and confirmed public certificate treatment.
- Trainer/contact identity and current TOP GYM role.
- Current opening hours: owner supplied listing data approximately four years old.
- Written address, verified embed coordinates/location, production domain.
- Transparent official logo, if one exists; current supplied original is sufficient for the review build.
- External link destination verification: web checks on 2026-11-05 could not resolve Maps/WhatsApp; Facebook was throttled. Exact supplied URLs are preserved and browser link integrity is tested. An owner/device check remains necessary; no group was joined.
