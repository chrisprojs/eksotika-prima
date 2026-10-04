# Implementation Plan — Selectable Price Type (Import / Local) on Product Detail

Goal: Let the USER choose the price type (Import price vs Local price) via a toggle on the product detail page, instead of deriving it from locale. Default selection is "import" regardless of locale. Currency labeling is already handled by the data layer and existing derived values (`activeCurrency`, `activeFromPrice`), so this task only adds the UI control, converts the hardcoded `priceType` to React state, wires i18n labels, and verifies the existing effects/WhatsApp message behave correctly.

Design decisions (grounded in the code I read):
- Use `useState("import")` for `priceType` (requirement: default must be "import" for every locale). Chosen over a URL-synced param because the user never asked for shareable price-type URLs, the existing URL-sync logic only tracks `variant`/`quantity`, and adding a third param risks the "state fight" the task warns about. Keeping it as local state is the smallest correct change.
- Remove `priceType` from the first (mount/URL-sync) `useEffect` dependency array. That effect's job is to reconcile state with the URL (`variant`/`quantity`); it only writes `selectedPrice` inside a guard that compares variant size and quantity, so a `priceType` change does not satisfy the guard and the price would NOT recompute there anyway. The second effect (`[selectedVariant, selectedQuantity, priceType]`) is the one that recomputes `selectedPrice` on a `priceType` change. Dropping `priceType` from the first effect's deps prevents a redundant re-run (and any future risk of clobbering selection) while leaving behavior correct. This is the "adjust so the toggle only drives priceType state and the price recompute" item the task calls for.
- Place the toggle just ABOVE the Quantity selector (between the WhatsApp button and the `{text.quantityLabel}` block), reusing the exact `.searchProduct-text` label + `.searchProduct-badge-box` / `.searchProduct-badge` pattern already used for Quantity and Package. No new CSS is required because the toggle reuses existing classes; the `selected` class already provides the highlighted state.

File paths are absolute from the workspace root `d:\react project in SSD\Eksotika Prima\eksotika-prima-next`.

---

- [ ] 1. Add price-type i18n labels to BOTH locales in `src/lib/i18n.js`.
      In `dictionary.id.productDetail` add: `priceTypeLabel: "Jenis Harga:"`, `importPrice: "Harga Impor"`, `localPrice: "Harga Lokal"`. In `dictionary.en.productDetail` add: `priceTypeLabel: "Price Type:"`, `importPrice: "Import Price"`, `localPrice: "Local Price"`. Place them near the existing `quantityLabel`/`variantLabel` keys to match the current ordering/style (plain string values, trailing colon on the section label like `quantityLabel`).
      Files: src/lib/i18n.js
      Verify: `npm run lint` passes (no new errors in i18n.js); the three keys exist under both `dictionary.id.productDetail` and `dictionary.en.productDetail`.

- [ ] 2. Convert the hardcoded `priceType` into React state in `src/app/product/[productId]/SearchProductClient.jsx`.
      Replace the two comment lines plus `const priceType = locale === "en" ? "import" : "local";` with `const [priceType, setPriceType] = useState("import");` (place it alongside the other `useState` hooks, e.g. right after `const [selectedQuantity, setSelectedQuantity] = useState(1);`). `useState` is already imported. Leave `importCurrency`, `activeCurrency`, and `activeFromPrice` exactly as-is — they read `priceType` and will now track the state automatically.
      Files: src/app/product/[productId]/SearchProductClient.jsx
      Verify: `npm run lint` passes; no remaining reference to the old locale-based `priceType` ternary. (Build verification is deferred to step 6.)

- [ ] 3. Fix the mount/URL-sync effect dependency array in `src/app/product/[productId]/SearchProductClient.jsx`.
      In the first `useEffect` (the one reading `searchParams.get("variant")` / `quantity`), remove `priceType` from its dependency array so it becomes `[currentProduct, searchParams, firstVariant]`. The internal `setSelectedPrice(getVariantPrice(targetVariant, targetQuantity, priceType))` call stays (it still uses the current `priceType` when variant/quantity actually change from the URL). This ensures toggling price type does not re-trigger URL reconciliation; the second `useEffect` (deps `[selectedVariant, selectedQuantity, priceType]`) remains unchanged and is what recomputes `selectedPrice` when the toggle flips.
      Files: src/app/product/[productId]/SearchProductClient.jsx
      Verify: `npm run lint` passes with no `react-hooks/exhaustive-deps` error for that effect (the effect body no longer needs `priceType` to be reactive, since price recompute on `priceType` lives in the second effect). If the Next.js lint config flags exhaustive-deps as an error, add an inline comment explaining the intentional omission or keep the dep but confirm no state-fight — prefer removing it per the design decision above.

- [ ] 4. Add the price-type toggle UI in `src/app/product/[productId]/SearchProductClient.jsx`.
      Insert a new label + badge-box block immediately BEFORE the existing `<p className="searchProduct-text"><strong>{text.quantityLabel}</strong></p>` block (i.e. just after the closing `</a>` of the WhatsApp link). Markup:
      ```jsx
      <p className="searchProduct-text">
        <strong>{text.priceTypeLabel}</strong>
      </p>
      <div className="searchProduct-badge-box">
        <span
          className={`searchProduct-badge ${priceType === "import" ? "selected" : ""}`}
          onClick={() => setPriceType("import")}
        >
          {text.importPrice}
        </span>
        <span
          className={`searchProduct-badge ${priceType === "local" ? "selected" : ""}`}
          onClick={() => setPriceType("local")}
        >
          {text.localPrice}
        </span>
      </div>
      ```
      Use `setPriceType` only — do NOT call `changePrice` or `updateUrlForSelection` here, so the toggle drives only `priceType` state (and the second effect's price recompute) without touching selected variant/quantity or the URL. The toggle stays visible in the wholesale state; it has no numeric effect there because `getVariantPrice` returns `null` for wholesale and the wholesale branch renders `text.wholesalePriceText` regardless of `priceType`.
      Files: src/app/product/[productId]/SearchProductClient.jsx
      Verify: `npm run lint` passes; the two badges render and clicking toggles the `selected` class (confirmed via build + manual/read-through in step 6).

- [ ] 5. Confirm currency, discount, and WhatsApp message auto-reflect the toggle (read-through verification, no new edits expected).
      Trace in `src/app/product/[productId]/SearchProductClient.jsx` that: (a) `activeCurrency = priceType === "import" ? importCurrency : "IDR"` and `activeFromPrice` already switch on `priceType`; (b) `selectedPrice` is recomputed by the `[selectedVariant, selectedQuantity, priceType]` effect; (c) `selectedPriceText = ... formatCurrency(selectedPrice, activeCurrency)` and `buyMessage` consume those, so the WhatsApp `buyWhatsAppUrl` text updates when the toggle flips; (d) the `discountPercentage`/`fromPriceTotal` math uses `activeFromPrice` and `selectedPrice`, keeping a coherent same-currency discount for each price type. No code change expected — if any of these still reference a stale local variable, fix it to use `priceType`/`activeCurrency`.
      Files: src/app/product/[productId]/SearchProductClient.jsx (verify only)
      Verify: Read-through confirms no hardcoded currency/priceType remains downstream of the new state; covered by the build/lint in step 6.

- [ ] 6. Run project verification.
      From `d:\react project in SSD\Eksotika Prima\eksotika-prima-next` run `npm run lint`, then `npm run build`. Expected: lint passes with no errors; build completes successfully (the product detail route compiles). If `npm run build` is too heavy or blocked by the environment (e.g. requires a database/Prisma or network for the exchange-rate fetch), fall back to: `npm run lint` passing AND no syntax/parse errors in the two edited files. Note which verification path was used.
      Files: (none — verification only)
      Verify: `npm run lint` exits 0; `npm run build` exits 0 (or documented fallback: lint clean + no syntax errors).

---

## Verification results (implementation iteration 1)

Ran from the project root `d:\react project in SSD\Eksotika Prima\eksotika-prima-next`:

- `npx next lint` (the `lint` script) is non-functional in this environment: Next 16 removed `next lint`, and running ESLint directly fails because the deprecated `.eslintrc.json` (`extends: next/core-web-vitals`) is incompatible with the flat config shipped by `eslint-config-next@16` (`TypeError: Converting circular structure to JSON`). This is a pre-existing config/environment issue, not introduced by this change.
- `npx next build` → **compilation succeeds**: `✓ Compiled successfully in 2.1s`. Next runs lint-during-build and raised no lint/syntax errors for the edited files. The build then fails only at the "Collecting page data" prerender phase with `PrismaClientInitializationError: the URL must start with the protocol file:` — because `next build` loads `.env.production`, whose `DATABASE_URL` is a remote `libsql://` Turso URL that Prisma's build-time datasource validator rejects (no live DB available in this environment). This is unrelated to the price-type change.

Fallback path used (per step 6): lint-in-build clean + successful compilation + no syntax/parse errors in the two edited files.

Logic trace confirmed by read-through:
- On first render `priceType` is `"import"` (useState default) and the Import badge gets the `selected` class.
- Clicking Local sets `priceType = "local"`; `activeCurrency` becomes `"IDR"` and `getVariantPrice` uses `variant.price` / `variant.dozenPrice`.
- The `[selectedVariant, selectedQuantity, priceType]` effect recomputes `selectedPrice` on toggle; the URL-sync effect no longer lists `priceType`, so toggling does not reset selected variant/quantity or the URL.
- en locale: Import shows `importCurrency` (USD) and Local shows IDR. id locale: Import and Local both show IDR but remain independently selectable (default still "import").
- `selectedPriceText` → `buyMessage` → `buyWhatsAppUrl` consume `selectedPrice` + `activeCurrency`, so the WhatsApp message auto-reflects the chosen price type.
- Wholesale unchanged: `getVariantPrice` returns `null` and the wholesale branch renders `text.wholesalePriceText` regardless of `priceType`.
- No new React key warnings; the omitted `priceType` dep carries an explicit `eslint-disable-next-line react-hooks/exhaustive-deps` with a rationale comment.

Notes / assumptions:
- No `.kiro/steering/*`, no project-specific `AGENTS.md`/`CONTRIBUTING.md`, and only the default Next.js `README.md` exist. Build/test commands come from `package.json`: `lint` → `next lint`, `build` → `next build`. There is no test runner configured, so verification relies on lint + build.
- The data layer (`src/lib/currency.js`) and `productService.js` are NOT modified, per constraints. Import currency (IDR for id, USD for en) and local-always-IDR behavior come entirely from `product.importCurrency` + the existing derived values.
- Wholesale behavior is unchanged: the wholesale branch renders `text.wholesalePriceText` and `getVariantPrice` returns `null` for wholesale, so the toggle has no numeric effect there.
