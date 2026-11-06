# Architecture

## Static rendering

Astro renders `/ar/` and `/en/` through one `Landing` component and section tree. `/` uses `business.defaultLocale`, with a small preference redirect only when an explicit locale was saved. Static HTML contains business content, links, complete prices and hours. The later private-feedback feature uses one Vercel Node API; no client framework is needed. See `CUSTOMER_FEEDBACK.md` for server boundaries and delivery semantics.

`Base.astro` owns language/direction, font imports, metadata, header/footer and shared dialog. Section modules separate visual composition from facts. `business.ts` is the typed source for contacts, hours, prices, links, facilities and the trainer publication gate. Translation files hold presentation labels; numeric prices/contact destinations are not duplicated there. `media.ts` describes reviewed photos.

## Progressive interactions

The bundled `site.ts` controls the menu, duration tabs, localized price updates, language preference, current Cairo status, year, and shared lightbox. The dialog uses native modal behavior plus explicit focus cycling, Escape, arrow navigation and opener focus restoration. Gallery anchors are valid image links without JavaScript. All prices remain in a semantic details/table fallback. Contacts are ordinary links.

## Motion

Motion remains a small native enhancement, with one shared reveal observer and declarative component attributes. The same configuration supplies CSS micro-interactions and interruptible Web Animations. See `MOTION_SYSTEM.md` for tokens, lifecycle, dynamic registration and accessibility; `MOTION_COVERAGE_MATRIX.md` records coverage without duplicating this architecture document.

## Time model

Opening/closing times are local minutes. Saturday through Thursday: 780–1440; Friday: 960–1320. Closing is exclusive. `Intl` determines the Cairo weekday/time for an absolute date, including Egyptian DST. No hardcoded UTC offset or visitor-local date is used. Status reflects provisional listed hours, not a verified live feed.

## SEO and release policy

`SITE_URL` is optional until a real origin is supplied. Canonicals/alternates and absolute share-image URLs are conditional. The root stays nonindexed to avoid duplicate-content indexing. `PUBLIC_INDEXABLE=false` is the safe review default; robots and sitemap follow the same configuration. ExerciseGym JSON-LD includes supplied identity/contact/map facts and excludes unconfirmed hours, address, coordinates, ratings and trainer identity.

## Assets and provenance

Sharp creates AVIF/WebP derivatives of owner-supplied photos, preserving source files. Public output excludes original archives, unapproved PDFs and unredacted certificate sources. The owner-approved pricing PDF is copied byte-for-byte, with a lazy-loaded one-page image preview instead of a heavyweight embedded PDF viewer; native view/download links work without JavaScript. Five reviewed enhanced certificate copies have baked-in registration-number redactions; full-size copies use lossless WebP. The promotional hero is tracked separately from genuine gym photographs. The manifest records every extracted file and its publication decision. The logo derivative contains the complete supplied presentation image. Source metadata is stripped from published derivatives by normal Sharp output.

## Quality and deployment

ESLint/TypeScript/Vitest/build run before browser checks. Playwright covers two locales, responsive widths, menu, prices, links, dialogs, feedback, preferences, loaded images, errors and axe scans. CI uploads evidence and never sends email. Vercel serves `dist/` alongside the native feedback function. Server environment values never use a `PUBLIC_` prefix. All production actions follow owner authorization and protected checks.

## Static QR image

`src/pages/qr/whatsapp.png.ts` generates a PNG during the Astro build from the central WhatsApp group URL. The QR library stays on the build side and adds no client JavaScript. Browser tests decode the generated PNG and compare its payload to the configured invitation.

## Active navigation and pricing documents

`navigation.ts` maintains desktop/mobile `aria-current="location"` together. One dedicated IntersectionObserver watches a band below the sticky header; debounced resize refreshes pixel margins. Deep links, clicks, hash changes and bfcache restoration are handled with pagehide teardown. There is no scroll listener or hash rewriting during scrolling. This observer has a continuous lifecycle distinct from the once-only motion observer. Click/hash feedback remains available if observation fails.

Six duration tabs share one pricing panel with roving tabindex, RTL-aware left/right arrows and Home/End. Selecting a tab immediately updates both prices and the panel label before applying the existing feedback animation. The complete price table remains usable without JavaScript. The official PDF is Arabic in both locale views, labeled as such; preview rendering uses PyMuPDF and Pillow, with no runtime PDF dependency.

The desktop spotlight reuses section state and one decorative marker; no additional observer is introduced for the light. See `MOTION_SYSTEM.md` for hysteresis, anchor handling and timing. The location section now uses the verified Google Maps embed from central configuration. Its entire surface is a native accessible link, as requested, so pointer/keyboard interaction opens the original Maps URL rather than trapping scroll in the iframe. Google attribution remains visible. The map loads lazily; no Google script or SDK is imported into the application bundle.
