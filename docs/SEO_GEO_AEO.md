# SEO, local discovery, GEO and AEO

## What the site provides

- Server-rendered-at-build-time HTML for Arabic (`/ar/`) and English (`/en/`), with matching `lang` and `dir` attributes.
- Locale-specific descriptions, canonical links, reciprocal `hreflang`, Open Graph and X/Twitter card metadata.
- A localized sitemap and a crawl policy that stays closed for local/review builds and is enabled only in the production Vercel environment; the public API path is excluded from crawling.
- JSON-LD `ExerciseGym`, `WebSite` and `WebPage` entities linked with stable IDs. It uses the supplied name, contact numbers, official map link, Facebook link, currency, logo, and descriptions.
- A 1200 × 630 social preview with explicit image dimensions, MIME type and alternative text.
- An IndexNow key file and one-shot publisher for the two canonical locale pages.
- Visible membership, equipment, contact and direction content that can be read without running client-side JavaScript.

The browser tab title remains `TOP GYM`, per the owner’s preference. Social and structured-data titles remain localized. The generated schema omits opening hours while the business configuration marks them unverified, and omits a street address because none has been supplied. Do not add GeoCoordinates, city names, ratings, reviews, awards, trainer affiliations or alternate social accounts without an authoritative source.

## Production verification

The Vercel Production environment must contain:

```text
SITE_URL=https://top-gym-website.vercel.app
PUBLIC_INDEXABLE=true
```

After a production build, verify:

1. `/robots.txt` permits crawling and references `/sitemap.xml`.
2. `/sitemap.xml` lists `/ar/` and `/en/` with their reciprocal language links.
3. Each locale page returns `200`, `index, follow`, its own canonical URL, and the other locale as an alternate.
4. `/` remains a nonindexed locale-selection entrypoint; the admin page stays `noindex`.
5. The social image, favicon, fonts, and JSON-LD URLs return successfully.
6. The JSON-LD contains no unconfirmed address or opening hours.

`npm run test:seo` checks the generated production metadata with a reserved test origin. It does not change or publish the real production URL.

## Search platforms and measurement

The sitemap is public and can be submitted to Google Search Console and Bing Webmaster Tools after an owner verifies the site property. Account verification, URL Inspection, indexing reports, Google Business Profile ownership and corrections require the owner’s Google/Microsoft accounts; this repository has no connected webmaster account. IndexNow can notify participating search engines without claiming that they indexed the URL. Run `npm run seo:indexnow` after publishing changed public pages. HTTP 200 means the endpoint accepted the notification, not that a page is indexed.

For local discovery, claim or verify the correct Google Business Profile and keep its name, phone, location pin, website, category and current hours consistent with the real business. This website has no verified street address or city in its source configuration, so the website cannot truthfully publish those structured properties yet. Operating hours on the website are explicitly provisional; confirm them before advertising them as current.

For GEO/AEO, the implementation favors crawlable HTML, clear headings, natural bilingual copy, accurate business facts, useful internal links, accessible text, and linked structured entities. There is no special markup that guarantees inclusion in AI answers. Google says its generative search features still rely on indexing and people-first content and do not require `llms.txt` or special AI schema. This project therefore does not add machine-only claims or fabricated FAQ/review content.

## Off-site work required

- Verify the production domain in Google Search Console and Bing Webmaster Tools, submit the sitemap, then inspect both locale pages.
- Verify/claim the Google Business Profile and correct its name, category, map pin, address policy and current hours.
- Use consistent official business name, phone, and map links on approved listings. Do not create profiles with invented addresses or use paid directory submissions without approval.
- Ask customers for honest reviews through the platform’s normal process; never manufacture reviews or mark them up as first-party local-business reviews.
- Track impressions, queries, clicks and indexing status in the official search dashboards after recrawl. Rankings and AI citations cannot be guaranteed by code changes.

## IndexNow key

`public/8f90ecc66028569f5c45b31c5b8253c2.txt` is a public protocol verification key, not a credential. The submission script is restricted to TOP GYM’s canonical Vercel origin and only submits `/ar/` and `/en/`. If the production domain changes, rotate the key and update this file, script and sitemap/metadata configuration together.
