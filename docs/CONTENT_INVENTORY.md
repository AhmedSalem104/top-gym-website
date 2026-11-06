# Source inventory and publishing decisions

## Owner's text update — 2026-11-06

The owner supplied replacement Hero copy stating nine years of experience/trust, personal training and follow-up, comprehensive fitness assessment, injury rehabilitation/physiotherapy supervised by specialists, and military preparation/tests. These statements are published as supplied, with English translations, from `business.hero`. They were not independently verified or inferred from certificate images. No founding date, military affiliation, medical license, practitioner identity or guaranteed result is asserted. The original certificate-holder name remains Ahmed AbdElhamid Salem AbdElhamid Salem. The visible promotional-photo caption and specified About paragraph were removed at the owner's request; image alternative text and media provenance remain accurate.

The machine-readable [asset manifest](asset-manifest.json) inventories the 32 extracted files and the approved pricing PDF with SHA-256 hashes, bytes, image dimensions, duplicates, destination paths and decisions. Archives stay outside Git. At the owner’s explicit request, a byte-identical public copy of the official pricing PDF and two rendered previews are now included; the local original is untouched.

## Integrated assets

| Source                            | Destination / usage                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `brand/top_gym_logo_original.jpg` | `top-gym-logo.webp`, favicon, social-share JPEG; original proportions/background retained |
| `gym_photos/01_chest_press.jpg`   | `chest-press-*`; facilities and gallery                                                   |
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

## Certificate review and publication

Following the owner's request to show the missing section, five supplied enhanced certificate copies are displayed. Each was visually reviewed; registration numbers are hidden by opaque pixels before producing either the preview or the full-size lossless WebP. Sources remain unchanged outside Git. The displayed 8 February–6 April 2023 dates are labeled **training period**, not award dates. The documents identify Ahmed AbdElhamid Salem AbdElhamid Salem; the site does not infer his employment or equate him with contact Ahmed. Original comparison and accreditation verification have not been performed.

| File                                   | Published subject / organization                                  | Disposition                                                    |
| -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `01_titanium_tass_cards.jpg`           | Overlapping TASS/PBLS identification cards and training statement | Retained privately; extra personal data and duplicate subjects |
| `02_tass_nutrition.jpg`                | Sports Nutrition Specialist / TASS                                | Redacted full copy and preview published                       |
| `03_pbls_personal_trainer.jpg`         | Certified Personal Trainer (Gym Coach) / PBLS Academy             | Redacted full copy and preview published                       |
| `04_tass_fitness_trainer.jpg`          | Certified Fitness Trainer / TASS                                  | Redacted full copy and preview published                       |
| `05_pbls_nutrition.jpg`                | Specialist in Sports Nutrition / PBLS Academy                     | Redacted full copy and preview published                       |
| `06_titanium_certificate.jpg`          | Training statement / Titanium Gym Group with World Gym            | Redacted full copy and preview published                       |
| `07_pbls_nutrition_variant.jpg`        | Alternate PBLS nutrition copy                                     | Retained privately; not counted as an additional qualification |
| `08_pbls_personal_trainer_variant.jpg` | Alternate PBLS personal trainer copy                              | Retained privately; not counted as an additional qualification |

`scripts/prepare-certificates.mjs` checks source SHA-256 hashes, applies documented registration-area redactions, strips metadata and creates separate web copies. No AI, documentary text replacement, seal/signature reconstruction or source overwrite is used. The manifest records every output and exact redaction rectangle. Both full copies and previews were visually reviewed after generation.

## Promotional hero and QR

The owner requested a professional replacement hero from Pinterest. The selected [male-athlete photograph](https://www.pinterest.com/pin/fotos-na-academia-masculina--844636105109617078/) is visibly labeled as promotional imagery, separate from actual TOP GYM equipment/gallery photography. `promotional-media.json` records the exact downloaded URL, hash, dimensions, derivatives and unresolved photographer/reuse-rights status. No facility or trainer identity is inferred from the image. Confirm reuse rights before production launch.

The visible WhatsApp QR encodes the supplied group invitation directly. It is generated into the static build from central business configuration with a white quiet zone and dark modules. A normal join button remains available on the same device. QR decoding is tested against the exact configured URL; no third-party QR redirect/service is used.

## Design source decisions

All six HTML variants were inspected for headings, sections, behaviors and images; both DESIGN.md files were read. Gold Desktop 2 is the primary reference. Elite variants use lime and are not used. Two elite HTML files are byte-identical (see manifest). Generated gym/certificate screenshots stay reference-only. No source prototype JavaScript or third-party placeholder images are shipped.

## Unresolved business content

- Original gym/certificate files for archival comparison; photographer/reuse rights for the requested Pinterest hero.
- Trainer/contact identity and current TOP GYM role.
- Current opening hours: owner supplied listing data approximately four years old.
- Owner-approved written address. The production domain is now supplied: `https://top-gym-website.vercel.app`. The supplied Maps listing and embed are verified; see `map-verification.json`. No numeric business coordinates were inferred.
- Transparent official logo, if one exists; current supplied original is sufficient for the review build.
- External link destination verification: initial web checks on 2026-11-05 could not resolve Maps/WhatsApp; Facebook was throttled. The later direct redirect and live embed check verified the supplied Maps place (`map-verification.json`). Exact supplied URLs are preserved and browser link integrity is tested. An owner/device check remains necessary; no group was joined.

## Current Hero source — 5 November 2026

The latest owner request replaces the previous Pinterest athlete with Risen Wang’s spacious-gym photograph from Unsplash. Reviewed 4000×2997 master and eight optimized derivatives are recorded in `hero-media.json` and the asset manifest. No people observed. The owner requested removing the visible caption on 6 November; promotional provenance remains in the image alternative text and documentation. It is not represented as TOP GYM’s premises. The previous Pinterest provenance is historical; its portrait is no longer referenced in the Hero. No membership values or source PDF bytes changed: only the requested duration labels changed.
