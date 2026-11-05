# Motion coverage matrix

Audit: 2026-11-05. Before this change the Astro site had color transitions, a gallery hover scale and a reduced-motion stylesheet; no viewport reveal system. All existing section order, targets, business facts and media remain intact during the motion implementation. The separately requested navbar correction restores the source's dark call/gold group hierarchy and segmented language control.

| Section/component          | Implemented behavior                                                              | Verification                                                                |
| -------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Header / brand             | Brief opaque entrance; scroll shadow without height change                        | Six locale/viewport cases measure unchanged header height and shadow state  |
| Desktop navigation         | Gold underline hover/focus with RTL origin                                        | Desktop visual review; all original anchor targets checked                  |
| Mobile menu                | 260 ms open / 160 ms close; interrupted toggles; focus/escape/outside handling    | Focus, rapid-toggle, anchor, language and unlocked-scroll browser checks    |
| Language switch            | Segmented state; hover/press feedback                                             | Both language routes, hash preservation and stored preference tests         |
| Hero                       | Eyebrow/heading → copy → CTAs; gentle image settle                                | LCP elements stay opaque; initial screenshots and recording                 |
| About                      | Heading hierarchy; real photo and story panel                                     | Arabic/English 390/768/1440 viewport activation and return-scroll checks    |
| Facilities                 | Heading hierarchy; image cards in reading order                                   | Same six cases; explicit RTL ordering and bounded stagger test              |
| Trainer / credentials      | Heading, holder, five cards, privacy note                                         | Six coverage cases; exact source titles/periods and keyboard lightbox tests |
| Gallery                    | Heading, staggered photographs, small image hover                                 | Six coverage cases; original image loading and dialog navigation checks     |
| Memberships                | Heading, duration control, plan cards, comparison table; immediate price feedback | Six coverage cases; all twelve price values and rapid selection tests       |
| Opening hours              | Heading, timezone, day rows, note, contact panel                                  | Six coverage cases; original Cairo/midnight/DST unit tests preserved        |
| Location                   | Heading, directions panel, genuine photograph                                     | Six coverage cases; exact supplied Maps href preserved; no invented embed   |
| Contact                    | Heading, phone cards, group copy, visible QR; CTA hover/press                     | Six coverage cases; exact telephone/group/social href and QR decode tests   |
| Final CTA                  | Label, headline, copy, actions                                                    | Six coverage cases; working contact destinations                            |
| Footer                     | Brand/navigation/contact/social columns and bottom line                           | Six coverage cases; offscreen pending state and once-only return behavior   |
| Gallery/certificate dialog | Shared native enter/exit/image feedback                                           | Arrow keys, Tab cycle, Escape, opener focus return and reduced motion       |
| Buttons/cards              | Small hover lift/press feedback, gold border/focus                                | Pointer-aware CSS; mobile/desktop visual review; axe/keyboard suite         |
| New/dynamic content        | Automatic registration, explicit refresh, no duplicate observers                  | Dynamic append, repeat refresh and bfcache lifecycle browser check          |
| Failure/no JavaScript      | Visible SSR content, no hidden pending state                                      | Throwing-observer scenario; existing no-JavaScript page checks              |
| Reduced motion             | Cancel/complete immediately; no transforms or transitions                         | Initial reduced preference and live preference change tests                 |

Coverage tests enumerate every marked element in every listed section; each must reach `complete` after entering the viewport, retain opacity 1 afterward and not restart during return scrolling. Test attachments record element counts for each section. A failed first test used Playwright's "already visible" scroll shortcut for an element outside the observer's 24 px activation inset; the test now explicitly centers targets inside the activation area.

Evidence and measurements are linked in `MOTION_SYSTEM.md`, `PROGRESS.md` and `QA_CHECKLIST.md`. Screenshots verify settled composition, while the recording shows timing; screenshots alone are not proof of motion quality. Headless Chromium and emulated CPU/network runs do not replace physical low-end Android/iOS, Safari or assistive-technology acceptance testing.
