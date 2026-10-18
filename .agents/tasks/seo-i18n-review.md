# SEO/i18n copy rewrite for Eksotika Prima oil brands

The change rewrites the marketing, FAQ, and SEO-metadata strings in `src/lib/i18n.js` for both `id` and `en` locales to target Eksotika Prima's positioning as the official store and wholesale supplier of massage/rubbing oil, cajuput oil, and balm from four brands (Tawon, Beruang/Bear, Rejeki Jaya, Kuda Bangau). It reworks meta titles/descriptions to lead with brand names, adds `keywords` arrays to the home and product meta blocks (which the page consumers already reference but previously resolved to `undefined`), and restructures the FAQ to add brand-specific, authenticity, official-store, and wholesale-export answers aimed at AI-search extraction. Object shape, keys, and the `contactAddress` constant are preserved; only `i18n.js` was touched. Build evidence is recorded in the commit message (`npm run build`, next 16.3.8, exit 0, all routes prerendered) and was not re-run here.

Watch for: the new `keywords` arrays were absent in the base (consumers resolved to `undefined`); they now populate home/product metadata — a net improvement, not a regression (confirmed). Product-line and producer claims in the FAQ were cross-checked against `src/data/ProductList.js` and match (confirmed). No fabricated certifications, medical claims, or invented statistics were introduced (confirmed).

**Verdict**: APPROVED

## High-level view

The SEO rewrite leads every meta title and description with brand names and the "official store / situs resmi" framing, then expands into wholesale, authenticity, and international-shipping terms. The copy is brand-dense but reads naturally and avoids list-style keyword stuffing in the prose fields; the dedicated `keywords` arrays carry the repetition where it belongs. Indonesian is the primary voice and the English is idiomatic rather than a literal translation (e.g. "Buy More, Bargain More!" for "Beli Banyak Nego Banyak!").

The FAQ grew from 10 to 17 parallel Q&A pairs per locale, adding self-contained answers for official-store status, 100% authenticity, a brand roster, per-brand product lines, Regular-vs-Super differences, wholesale-for-export, and marketplace availability. Each answer names producers and product variants explicitly, which is what makes them extractable by an LLM without surrounding context. Every producer and sourcing claim traces to the project's own `ProductList.js` data.

The structural surface is intact: both locales carry the same 17 FAQ topics in the same order, the consumed meta keys (`title`, `description`, `openGraphDescription`, `twitterDescription`, `keywords`) are present where their page consumers expect them, and the `contactAddress` constant and the Jakarta Utara address in the location FAQ are unchanged. Braces and brackets balance; no keys were removed or renamed.

<details>
<summary>Issues (2)</summary>

1. **New keywords arrays on previously-undefined consumers** — `meta.home.keywords` and `meta.product.keywords` did not exist in the base, so the `keywords: meta.keywords` lines in the four page.js consumers resolved to `undefined`. The change populates them correctly; no consumer change needed. Informational, non-blocking.
2. **"Official store / situs resmi" is an unverifiable positioning claim** — the copy asserts Eksotika Prima is the official store and that products are "100% asli / guaranteed genuine." This mirrors the existing `ProductList.js` detail copy ("Garansi Barang 100% Asli") so it is consistent with the site's own stance, but it is a business/legal claim the reviewer cannot independently verify. Confirm it reflects the company's actual authorization. Non-blocking.

</details>

<details>
<summary>Details</summary>

### Brand coverage and keyword balance

All four brands appear across both locales in meta titles, descriptions, the about/import prose, and dedicated FAQ entries. The home meta title now leads with the brand roster ("Minyak Gosok Tawon, Beruang, Rejeki Jaya, Kuda Bangau | Situs Resmi Eksotika Prima" / "Tawon, Bear, Rejeki Jaya & Kuda Bangau Massage Oil | Official Eksotika Prima Store"), which front-loads the highest-value query terms. Descriptions stay within a compelling single-sentence-plus length and weave brands, product types (minyak gosok, minyak kayu putih, balsem), and the wholesale/international angle without devolving into comma-separated keyword lists.

The `keywords` arrays hold 18–20 deduplicated terms each, mixing head terms (supplier minyak gosok, massage oil supplier Indonesia), brand terms, and long-tail product terms (minyak kayu putih beruang grizzly, Bear Grizzly cajuput oil, minyak cengkeh kuda bangau). They are distinct between home and product (product leans into "jual/buy" transactional intent) and between locales, keeping term repetition in the arrays rather than the prose fields.

### FAQ answerability for AI search

The FAQ went from 10 to 17 pairs per locale. The added entries each stand alone: the brand-roster answer names all four producers inline, the per-brand answers list the actual product variants Eksotika Prima stocks, and the authenticity/official-store answers state the claim directly. This self-containment is what lets an answer be lifted into an AI-search result without the question or page context. Topic coverage spans official-store status, authenticity, brand roster, per-brand lines (Tawon, Beruang/Bear, Rejeki Jaya, Kuda Bangau), Regular-vs-Super, ordering + marketplaces, wholesale/nego, wholesale-for-export, international shipping, nationwide delivery, location, and the why-choose-us summary.

Both locales carry the same 17 topics in the same order. The Indonesian is the stronger, primary voice; the English is idiomatic (brand names glossed as "Bear (Beruang)", "cajuput (eucalyptus) oil") rather than word-for-word.

### Factual grounding against product data

Every producer and sourcing claim in the FAQ was cross-checked against `src/data/ProductList.js`:

```
Tawon        -> PT. Tawon Jaya Makassar                         (matches)
Beruang/Bear -> PT. Granindo - Makassar Indonesia               (matches)
Kuda Bangau  -> Perusahaan Jamu Gunung Alam Makassar-Sulawesi   (matches)
Rejeki Jaya  -> UD Rejeki Jaya; cajuput from Pulau Buru/Namlea/Ambon (matches)
```

Product-specific references also check out: "Minyak Kayu Putih Cap Beruang Grizzly", Kuda Bangau clove (Minyak Cengkeh) and cajuput oils, and Tawon Regular/Super + Balsem all exist as products. The warming-sensation and Regular-vs-Super wording stays descriptive and avoids disease-treatment claims. No certifications, lab results, or market-share numbers were invented. The "largest supplier" phrasing is carried over from the base copy, not newly introduced.

### Structure and consumed keys

`contactAddress` remains a single constant and both locales reference it via `location: contactAddress`; the Jakarta Utara address in the location FAQ answer is unchanged. The meta keys consumed by the app — `title`, `description`, `openGraphDescription` (home), `twitterDescription` (product), and `keywords` (home + product) — are all present for each locale, matching what `src/app/**/page.js` reads. `meta.contact` and `meta.news` do not reference `keywords` in their consumers and none was added, which is consistent. Brace and bracket counts balance (129/129, 20/20) and the file parses as a valid ES module exporting `dictionary`; question/answer counts are symmetric (34/34 total, 17 per locale).

</details>

<details>
<summary>File map</summary>

- `src/lib/i18n.js` — SEO/i18n content rewrite: meta titles/descriptions, new home+product `keywords` arrays, expanded 17-item FAQ, and brand-focused marketing prose for both `id` and `en`. Structure/keys unchanged.

Full diff: `git diff origin/v-6.0 HEAD -- src/lib/i18n.js`

</details>
