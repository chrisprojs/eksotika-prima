Website: https://christian-antonius-portfolio.netlify.app/

# Eksotika Prima

Eksotika Prima is the largest rub oil supplier distributed from Makassar to Jakarta. This website help pharmacies and oil seller to see various products and details from website.

## SQLite database

The app uses Prisma with SQLite. Local database files live under `prisma/` through `DATABASE_URL="file:./dev.db"`.

Create or update the SQLite schema:

```powershell
npm run prisma:push
```

Convert the SQL Server backup into SQLite:

```powershell
npm run db:migrate:bak -- -BackupPath .\eksotika-prima.bak -SqlServer ".\SQLEXPRESS"
```

If Windows authentication is not available for SQL Server, pass SQL authentication instead:

```powershell
npm run db:migrate:bak -- -BackupPath .\eksotika-prima.bak -SqlServer ".\SQLEXPRESS" -SqlUsername "sa" -SqlPassword "your-password"
```

## Home Page
![Home Page](documentation/1.jpg)

## Product Detail Page
![Product Detail Page](documentation/2.jpg)

## Product Page
![Product Page](documentation/3.jpg)
