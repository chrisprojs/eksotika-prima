Website: https://christian-antonius-portfolio.netlify.app/

# Eksotika Prima

Eksotika Prima is a rub oil supplier from Makassar to Jakarta. This website helps pharmacies and oil sellers see products and product details.

## Database setup

This project uses one Prisma setup and one Turso libSQL database.

```txt
prisma/schema.prisma
        |
        v
prisma/migrations/
        |
        v
DATABASE_URL + TURSO_AUTH_TOKEN
        |
        v
Turso libSQL database
        |
        v
Product + Variant + News + NewsProduct tables
```

Main files:

```txt
prisma/schema.prisma
prisma/migrations/
src/lib/prisma.js
```

Environment variables:

```env
DATABASE_URL="libsql://your-database-name.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"
```

Generate Prisma client:

```powershell
npm run prisma:generate
```

Create a new migration after changing `prisma/schema.prisma`:

```powershell
npx prisma migrate dev --name your_migration_name --create-only
```

Apply migrations to Turso:

Prisma CLI cannot apply migrations directly to `libsql://` with this setup. Apply the SQL files to Turso using Turso CLI or a libSQL script.

```powershell
Get-Content -Raw .\prisma\migrations\20251110173201_init\migration.sql | turso db shell YOUR_DB_NAME
Get-Content -Raw .\prisma\migrations\20260628001000_add_news\migration.sql | turso db shell YOUR_DB_NAME
```


## Database localization

Localized text is saved as JSON inside the same text column.
Indonesian text uses the `id` key. English text uses the `en` key.
If English text is missing, that row is not shown on English pages.

```txt
Browser opens /en/product/1 or /en/news/story
        |
        v
Next.js page sends locale="en"
        |
        v
Prisma reads the same Product / News row
        |
        v
src/lib/dbLocalization.js reads JSON from title, summary, etc.
        |
        v
Page shows JSON value for "en". Rows without "en" are hidden
```

JSON column pattern:

```json
{
  "id": "Minyak Cap Tawon",
  "en": "Tawon Oil"
}
```

Main fields that can contain localized JSON:

```txt
Product: title, merk, detail
News:    slug, title, summary, contentHtml

`produsen` stays plain text and is not localized.

Rows without `en` are hidden from English pages and English API responses.
```

Apply localization migration to Turso:

```powershell
Get-Content -Raw .\prisma\migrations\20260710000000_add_database_localization\migration.sql | turso db shell YOUR_DB_NAME
```

Example product English update:

```sql
UPDATE Product
SET title = json_set(
        CASE WHEN json_valid(title) AND json_type(title) = 'object'
             THEN title
             ELSE json_object('id', title)
        END,
        '$.en',
        'Bear Brand Balm'
    ),
    merk = json_set(
        CASE WHEN json_valid(merk) AND json_type(merk) = 'object'
             THEN merk
             ELSE json_object('id', merk)
        END,
        '$.en',
        'Bear'
    ),
    detail = json_set(
        CASE WHEN json_valid(detail) AND json_type(detail) = 'object'
             THEN detail
             ELSE json_object('id', detail)
        END,
        '$.en',
        'Original multipurpose rubbing balm.'
    )
WHERE productId = 39;
```

Example news English slug update:

```sql
UPDATE News
SET slug = json_set(
        CASE WHEN json_valid(slug) AND json_type(slug) = 'object'
             THEN slug
             ELSE json_object('id', slug)
        END,
        '$.en',
        '5-rubbing-oils-to-help-relieve-stomach-aches'
    )
WHERE slug = '5-minyak-gosok-yang-dapat-membantu-meredakan-sakit-perut'
   OR (json_valid(slug) AND json_extract(slug, '$.id') = '5-minyak-gosok-yang-dapat-membantu-meredakan-sakit-perut');
```

Example product update by API:

```powershell
Invoke-RestMethod -Method Put `
  -Uri "http://localhost:3000/api/admins?product_id=39" `
  -Headers @{ "admin-key" = "your-admin-key" } `
  -ContentType "application/json" `
  -Body '{
    "titleEn": "Bear Brand Balm",
    "merkEn": "Bear",
    "detailEn": "Original multipurpose rubbing balm."
  }'
```

Example news update by API:

```powershell
Invoke-RestMethod -Method Put `
  -Uri "http://localhost:3000/api/news?news_id=1" `
  -Headers @{ "admin-key" = "your-admin-key" } `
  -ContentType "application/json" `
  -Body '{
    "slugEn": "5-rubbing-oils-to-help-relieve-stomach-aches",
    "titleEn": "5 Rubbing Oils to Help Relieve Stomach Aches"
  }'
```

Example news create body with JSON text:

```json
{
  "slug": {
    "id": "contoh-berita",
    "en": "example-news"
  },
  "title": {
    "id": "Contoh Berita",
    "en": "Example News"
  },
  "summary": {
    "id": "Ringkasan pendek berita.",
    "en": "Short news summary."
  },
  "contentHtml": {
    "id": "<p>Isi berita bahasa Indonesia.</p>",
    "en": "<p>English news content.</p>"
  },
  "productIds": [1]
}
```
## Dynamic news page

The news page uses the same Prisma database as products.

Flow:

```txt
Admin sends news HTML + product IDs
        |
        v
/api/news
        |
        v
Database tables: News + NewsProduct
        |
        v
/news/[slug]
        |
        +--> left: news HTML
        |
        +--> right: related products
```

Main files:

```txt
src/app/news/page.js
src/app/news/[slug]/page.js
src/app/api/news/route.js
src/lib/newsData.js
src/lib/newsHtml.js
```

Create news by API:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/news `
  -Headers @{ "admin-key" = "your-admin-key" } `
  -ContentType "application/json" `
  -Body '{
    "slug": "contoh-berita",
    "title": "Contoh Berita",
    "summary": "Ringkasan pendek berita.",
    "contentHtml": "<h2>Judul Bagian</h2><p>Isi berita bisa pakai HTML.</p>",
    "coverImage": null,
    "productIds": [1, 2]
  }'
```

Edit news by API:

```powershell
Invoke-RestMethod -Method Put `
  -Uri "http://localhost:3000/api/news?news_id=1" `
  -Headers @{ "admin-key" = "your-admin-key" } `
  -ContentType "application/json" `
  -Body '{
    "slug": "contoh-berita-update",
    "title": "Contoh Berita Update",
    "summary": "Ringkasan baru.",
    "contentHtml": "<p>Isi berita baru.</p>",
    "productIds": [1]
  }'
```

Open news page:

```txt
http://localhost:3000/news
http://localhost:3000/news/contoh-berita
```

## Important note

News HTML is saved in the database as `contentHtml`.

The page removes dangerous tags like `<script>` before showing the HTML.

## Home Page

![Home Page](documentation/1.jpg)

## Product Detail Page

![Product Detail Page](documentation/2.jpg)

## Product Page

![Product Page](documentation/3.jpg)
