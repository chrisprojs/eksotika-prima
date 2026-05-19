export const siteUrl = (
  process.env.NEXT_PUBLIC_URL ||
  process.env.URL ||
  "https://eksotikaprima.netlify.app"
).replace(/\/$/, "");

export const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${siteUrl}/api`
).replace(/\/$/, "");
