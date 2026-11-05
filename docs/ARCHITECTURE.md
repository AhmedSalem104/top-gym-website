# Architecture

## Static rendering

Astro renders `/ar/` and `/en/` through one `Landing` component and section tree. `/` uses `business.defaultLocale`, with a small preference redirect only when an explicit locale was saved. Static HTML contains business content, links, complete prices and hours. No client framework or backend is needed.

`Base.astro` owns language/direction, font imports, metadata, header/footer and shared dialog. Section modules separate visual composition from facts. `business.ts` is the typed source for contacts, hours, prices, links, facilities and the trainer publication gate. Translation files hold presentation labels; numeric prices/contact destinations are not duplicated there. `media.ts` describes reviewed photos.

## Progressive interactions

The bundled `site.ts` controls the menu, duration selector, localized price updates, language preference, current Cairo status, year, and shared lightbox. The dialog uses native modal behavior plus explicit focus cycling, Escape, arrow navigation and opener focus restoration. Gallery anchors are valid image links without JavaScript. All prices remain in a semantic details/table fallback. Contacts are ordinary links.

## Time model

Opening/closing times are local minutes. Saturday through Thursday: 780–1440; Friday: 960–1320. Closing is exclusive. `Intl` determines the Cairo weekday/time for an absolute date, including Egyptian DST. No hardcoded UTC offset or visitor-local date is used. Status reflects provisional listed hours, not a verified live feed.

## SEO and release policy

`SITE_URL` is optional until a real origin is supplied. Canonicals/alternates and absolute share-image URLs are conditional. The root stays nonindexed to avoid duplicate-content indexing. `PUBLIC_INDEXABLE=false` is the safe review default; robots and sitemap follow the same configuration. ExerciseGym JSON-LD includes supplied identity/contact/map facts and excludes unconfirmed hours, address, coordinates, ratings and trainer identity.

## Assets and provenance

Sharp creates AVIF/WebP derivatives of owner-supplied photos, preserving source files. Public output never includes original archives/PDFs or withheld certificate photos. The manifest records every extracted file and its publication decision. The logo derivative contains the complete supplied presentation image. Source metadata is stripped from published derivatives by normal Sharp output.

## Quality and deployment

ESLint/TypeScript/Vitest/build run before browser checks. Playwright covers two locales, five widths, menu, prices, links, dialog, preferences, loaded images, errors and axe scans. CI uploads evidence and never deploys. A static host serves `dist/`; there are no secrets or application environment services. All production actions remain subject to owner authorization.
