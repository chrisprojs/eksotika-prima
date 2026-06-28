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
