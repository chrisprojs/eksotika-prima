// Canonical production domain is https://eksotikaprima.com (set via NEXT_PUBLIC_URL).
// The netlify value below is only a fallback; do not change it to the canonical domain.
export const siteUrl = (
  process.env.NEXT_PUBLIC_URL ||
  process.env.URL ||
  "https://eksotikaprima.com"
).replace(/\/$/, "");

export const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${siteUrl}/api`
).replace(/\/$/, "");
